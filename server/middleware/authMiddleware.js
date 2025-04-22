const jwt = require('jsonwebtoken');
const OktaJwtVerifier = require('@okta/jwt-verifier');

// In a real app, you would initialize the Okta JWT verifier
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER,
  clientId: process.env.OKTA_CLIENT_ID,
});

// Verify JWT token middleware
exports.verifyToken = (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
                  ? req.headers.authorization.split(' ')[1] : null);
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
      
      // Attach user info to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// Verify Okta token (would be used in production)
exports.verifyOktaToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/Bearer (.+)/);
    
    if (!match) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const accessToken = match[1];
    
    try {
      const jwt = await oktaJwtVerifier.verifyAccessToken(accessToken, process.env.OKTA_AUDIENCE);
      
      // Attach user info to request
      req.user = {
        id: jwt.claims.sub,
        email: jwt.claims.email,
        name: jwt.claims.name
      };
      
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};