const express = require('express');
const EmergencyController = require('../controllers/emergencyController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js'); // fixed

const router = express.Router();
const emergencyController = new EmergencyController();
const authenticateToken = new AuthenticateToken();

/**
 * @openapi
 * /api/emergency:
 *   post:
 *     tags: [Emergency]
 *     summary: Create emergency request
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmergencyRequest'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/emergency', authenticateToken.authenticateToken, emergencyController.addEmergencyRequest);

/**
 * @openapi
 * /api/emergency:
 *   get:
 *     tags: [Emergency]
 *     summary: Get all emergency requests for logged-in user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Records
 */
router.get('/emergency', authenticateToken.authenticateToken, emergencyController.getMyEmergencyRequests);

module.exports = router;