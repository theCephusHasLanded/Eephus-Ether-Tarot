const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Login route (in a real app would redirect to Okta)
router.post('/login', authController.login);

// Logout route
router.post('/logout', authController.logout);

// Demo routes for simulating Okta auth flow
router.post('/demo-login', authController.demoLogin);
router.post('/demo-logout', authController.demoLogout);

// Get current user info
router.get('/me', authMiddleware.verifyToken, authController.getCurrentUser);

// Okta callback route (would be used in production with actual Okta)
router.get('/callback', authController.handleOktaCallback);

module.exports = router;