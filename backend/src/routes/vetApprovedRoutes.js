const express = require('express');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const VetApprovedController = require('../controllers/vetApprovedController.js');

const router = express.Router();
const authenticateToken = new AuthenticateToken();
const vetApprovedController = new VetApprovedController();

/**
 * @openapi
 * /api/vet-approvals/{requestId}:
 *   post:
 *     tags: [Vet Approval]
 *     summary: Vet approves a request
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
 *               note:
 *                 type: string
 *                 description: Optional note about the approval
 *     responses:
 *       201:
 *         description: Request approved successfully
 */
router.post('/vet-approvals/:requestId', authenticateToken.authenticateToken, vetApprovedController.approveRequest);

/**
 * @openapi
 * /api/vet-approvals/{requestId}:
 *   get:
 *     tags: [Vet Approval]
 *     summary: Get approval details by request ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Approval details
 */
router.get('/vet-approvals/:requestId', authenticateToken.authenticateToken, vetApprovedController.getApprovalByRequestId);

/**
 * @openapi
 * /api/vet-approvals/my-approvals:
 *   get:
 *     tags: [Vet Approval]
 *     summary: Get all approvals by current vet
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of approvals by the vet
 */
router.get('/vet-approvals/my-approvals', authenticateToken.authenticateToken, vetApprovedController.getMyApprovals);

/**
 * @openapi
 * /api/vet-approvals/all:
 *   get:
 *     tags: [Vet Approval]
 *     summary: Get all approved requests (admin)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all approved requests
 */
router.get('/vet-approvals/all', authenticateToken.authenticateToken, vetApprovedController.getAllApprovedRequests);

/**
 * @openapi
 * /api/vet-approvals/{requestId}/note:
 *   patch:
 *     tags: [Vet Approval]
 *     summary: Update approval note
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: Updated note
 *             required:
 *               - note
 *     responses:
 *       200:
 *         description: Note updated successfully
 */
router.patch('/vet-approvals/:requestId/note', authenticateToken.authenticateToken, vetApprovedController.updateApprovalNote);

/**
 * @openapi
 * /api/vet-approvals/{requestId}:
 *   delete:
 *     tags: [Vet Approval]
 *     summary: Revoke approval
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Approval revoked successfully
 */
router.delete('/vet-approvals/:requestId', authenticateToken.authenticateToken, vetApprovedController.revokeApproval);

module.exports = router;
