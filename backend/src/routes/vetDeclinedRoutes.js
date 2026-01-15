const express = require('express');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const VetDeclinedController = require('../controllers/vetDeclinedController.js');

const router = express.Router();
const authenticateToken = new AuthenticateToken();
const controller = new VetDeclinedController();

/**
 * @openapi
 * /api/vet-declines/{requestId}:
 *   post:
 *     tags: [Vet Decline]
 *     summary: Vet declines an ML diagnostic request with correct diagnosis
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correct_diagnosis:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Declined
 */
router.post('/vet-declines/:requestId', authenticateToken.authenticateToken, controller.declineRequest);

/**
 * @openapi
 * /api/vet-declines/my-declines:
 *   get:
 *     tags: [Vet Decline]
 *     summary: Get declines by current vet
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Declines list
 */
router.get('/vet-declines/my-declines', authenticateToken.authenticateToken, controller.getMyDeclines);

module.exports = router;
