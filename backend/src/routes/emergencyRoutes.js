const express = require('express');
const EmergencyController = require('../controllers/emergencyController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js'); // fixed

const router = express.Router();
const emergencyController = new EmergencyController();
const authenticateToken = new AuthenticateToken();

// Create emergency request
router.post('/emergency', authenticateToken.authenticateToken, emergencyController.addEmergencyRequest);

// Get all emergency requests for logged-in user
router.get('/emergency', authenticateToken.authenticateToken, emergencyController.getMyEmergencyRequests);

module.exports = router;