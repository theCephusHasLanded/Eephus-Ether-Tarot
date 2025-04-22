const express = require('express');
const router = express.Router();
const tarotController = require('../controllers/tarotController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (rate limited but no auth required)
router.post('/generate-reading', tarotController.generateBasicReading);

// Protected routes (require authentication)
router.post('/premium-reading', authMiddleware.verifyToken, tarotController.generatePremiumReading);
router.post('/save-reading', authMiddleware.verifyToken, tarotController.saveReading);
router.get('/readings', authMiddleware.verifyToken, tarotController.getUserReadings);
router.delete('/readings/:id', authMiddleware.verifyToken, tarotController.deleteReading);
router.get('/trends', authMiddleware.verifyToken, tarotController.getUserTrends);

module.exports = router;