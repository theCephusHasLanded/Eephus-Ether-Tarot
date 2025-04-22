const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// PKCE and state generation endpoints
router.get('/login-state', authController.generateLoginState);
router.get('/pkce-challenge', authController.generatePkceChallenge);

// Login route - initiates the authorization code flow
router.get('/login', authController.login);

// Logout route
router.get('/logout', authController.logout);

// Demo routes for simulating Okta auth flow (for development)
router.post('/demo-login', authController.demoLogin);
router.post('/demo-logout', authController.demoLogout);

// Get current user info
router.get('/me', authMiddleware.verifyToken, authController.getCurrentUser);

// Okta callback route - handles the authorization code
router.get('/callback', authController.handleOktaCallback);

module.exports = router;