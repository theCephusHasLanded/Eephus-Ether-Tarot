const jwt = require('jsonwebtoken');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const axios = require('axios');

// In a real app, you would use Okta's JWT verifier
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER,
  clientId: process.env.OKTA_CLIENT_ID,
});

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
};

// Set cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

// Login controller (would redirect to Okta in production)
exports.login = async (req, res, next) => {
  try {
    // In a real implementation, redirect to Okta
    res.redirect(`${process.env.OKTA_ISSUER}/v1/authorize?client_id=${process.env.OKTA_CLIENT_ID}&response_type=code&scope=openid profile email&redirect_uri=${encodeURIComponent(process.env.OKTA_REDIRECT_URI)}&state=${generateRandomState()}`);
  } catch (error) {
    next(error);
  }
};

// Logout controller
exports.logout = (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// Get current user info
exports.getCurrentUser = (req, res) => {
  // User info is already attached to req.user by the auth middleware
  res.status(200).json({ 
    success: true, 
    data: { 
      id: req.user.id,
      email: req.user.email,
      name: req.user.name || req.user.email
    } 
  });
};

// Handle Okta callback (in a real app, would exchange code for tokens)
exports.handleOktaCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    // Validate state parameter (protection against CSRF)
    // Implementation would validate against state saved in session
    
    // Exchange code for tokens
    const tokenResponse = await axios.post(`${process.env.OKTA_ISSUER}/v1/token`, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.OKTA_REDIRECT_URI,
      client_id: process.env.OKTA_CLIENT_ID,
      client_secret: process.env.OKTA_CLIENT_SECRET
    });
    
    // Verify the ID token
    const { idToken } = tokenResponse.data;
    const jwt = await oktaJwtVerifier.verifyAccessToken(idToken, process.env.OKTA_AUDIENCE);
    
    // Extract user info
    const user = {
      id: jwt.claims.sub,
      email: jwt.claims.email,
      name: jwt.claims.name
    };
    
    // Generate our own JWT
    const token = generateToken(user);
    
    // Set cookie and redirect to frontend
    res.cookie('token', token, cookieOptions);
    res.redirect('/');
  } catch (error) {
    next(error);
  }
};

// Demo authentication (for development purposes only)
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

// Helper function to generate random state
function generateRandomState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}