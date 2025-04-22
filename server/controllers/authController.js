const jwt = require('jsonwebtoken');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const axios = require('axios');
const crypto = require('crypto');

// Initialize Okta JWT Verifier
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER,
  clientId: process.env.OKTA_CLIENT_ID,
});

// Helper to generate JWT token for our application
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0]
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
};

// Set cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // Changed from 'strict' to 'lax' for better cross-site experience
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

// Generate a random state value for CSRF protection
exports.generateLoginState = (req, res) => {
  try {
    // Generate a random state value
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in session for verification later
    req.session.authState = state;
    
    // Return state to client
    res.status(200).json({ 
      success: true, 
      data: { state } 
    });
  } catch (error) {
    console.error('Error generating auth state:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate authentication state' 
    });
  }
};

// Generate PKCE code challenge and verifier
exports.generatePkceChallenge = (req, res) => {
  try {
    // If using pkce-challenge library:
    // const pkce = require('pkce-challenge').default();
    // const codeVerifier = pkce.code_verifier;
    // const codeChallenge = pkce.code_challenge;
    
    // Manual implementation:
    // Generate code verifier - random string between 43-128 chars
    const codeVerifier = crypto.randomBytes(64).toString('base64url');
    
    // Generate code challenge - SHA256 hash of verifier, base64url encoded
    const codeChallenge = crypto.createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Store code verifier in session for later use
    req.session.codeVerifier = codeVerifier;
    
    // Return code challenge to client
    res.status(200).json({ 
      success: true, 
      data: { 
        codeChallenge,
        codeChallengeMethod: 'S256'
      } 
    });
  } catch (error) {
    console.error('Error generating PKCE challenge:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate PKCE challenge' 
    });
  }
};

// Initiate login by redirecting to Okta
exports.login = (req, res, next) => {
  try {
    // Get state and PKCE from request
    const { state, codeChallenge } = req.query;
    
    if (!state || !codeChallenge) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing state or code challenge' 
      });
    }
    
    // Build the authorization URL
    const authUrl = new URL(`${process.env.OKTA_ISSUER}/v1/authorize`);
    
    // Add query parameters
    authUrl.searchParams.append('client_id', process.env.OKTA_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid profile email');
    authUrl.searchParams.append('redirect_uri', process.env.OKTA_REDIRECT_URI);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    
    // Redirect to Okta login
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating login:', error);
    next(error);
  }
};

// Handle Okta callback - exchange code for tokens
exports.handleOktaCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    // Validate state parameter (protection against CSRF)
    if (!state || state !== req.session.authState) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid state parameter' 
      });
    }
    
    // Get code verifier from session
    const codeVerifier = req.session.codeVerifier;
    if (!codeVerifier) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing code verifier' 
      });
    }
    
    // Clean up session data
    delete req.session.authState;
    delete req.session.codeVerifier;
    
    // Exchange code for tokens
    const tokenResponse = await axios.post(`${process.env.OKTA_ISSUER}/v1/token`, 
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.OKTA_CLIENT_ID,
        client_secret: process.env.OKTA_CLIENT_SECRET,
        code,
        code_verifier: codeVerifier,
        redirect_uri: process.env.OKTA_REDIRECT_URI
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Extract tokens
    const { id_token, access_token } = tokenResponse.data;
    
    // Verify the ID token
    const jwt = await oktaJwtVerifier.verifyIdToken(id_token, process.env.OKTA_CLIENT_ID);
    
    // Extract user info from claims
    const user = {
      id: jwt.claims.sub,
      email: jwt.claims.email,
      name: jwt.claims.name || jwt.claims.preferred_username
    };
    
    // Generate our application JWT
    const token = generateToken(user);
    
    // Store tokens in session
    req.session.oktaToken = {
      idToken: id_token,
      accessToken: access_token,
      appToken: token
    };
    
    // Set app token in cookie
    res.cookie('token', token, cookieOptions);
    
    // Redirect to frontend
    res.redirect('/');
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect('/?error=authentication_failed');
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // Get ID token from session
    const idToken = req.session.oktaToken?.idToken;
    
    // Clear session
    req.session.destroy();
    
    // Clear cookie
    res.clearCookie('token', cookieOptions);
    
    // If we have an ID token, redirect to Okta logout
    if (idToken) {
      const logoutUrl = new URL(`${process.env.OKTA_ISSUER}/v1/logout`);
      logoutUrl.searchParams.append('id_token_hint', idToken);
      logoutUrl.searchParams.append('post_logout_redirect_uri', `${req.protocol}://${req.get('host')}`);
      
      return res.redirect(logoutUrl.toString());
    }
    
    // Otherwise, just return success response
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ success: false, message: 'Failed to logout' });
  }
};

// Get current user info
exports.getCurrentUser = (req, res) => {
  // User info is already attached to req.user by the auth middleware
  res.status(200).json({ 
    success: true, 
    data: { 
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    } 
  });
};

// For development/demo purposes only
exports.demoLogin = (req, res, next) => {
  try {
    const { email = 'user@example.com' } = req.body;
    
    // Create a demo user
    const demoUser = {
      id: '12345',
      email,
      name: email.split('@')[0]
    };
    
    // Generate token
    const token = generateToken(demoUser);
    
    // Set cookie
    res.cookie('token', token, cookieOptions);
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Demo login successful',
      data: {
        user: demoUser,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.demoLogout = (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.status(200).json({ success: true, message: 'Demo logout successful' });
};