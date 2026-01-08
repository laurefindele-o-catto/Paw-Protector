const express = require('express');
const multer = require('multer');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const RequestController = require('../controllers/requestController.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const authenticateToken = new AuthenticateToken();
const requestController = new RequestController();

/**
 * @openapi
 * /api/requests:
 *   post:
 *     tags: [Request]
 *     summary: Create a new request with pre-generated URL
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content_url:
 *                 type: string
 *                 description: URL of the content/file
 *             required:
 *               - content_url
 *     responses:
 *       201:
 *         description: Request created successfully
 */
router.post('/requests', authenticateToken.authenticateToken, requestController.createRequest);

/**
 * @openapi
 * /api/requests/upload:
 *   post:
 *     tags: [Request]
 *     summary: Upload file and create request
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image (PNG, JPEG, WebP) or PDF file
 *     responses:
 *       201:
 *         description: File uploaded and request created successfully
 */
router.post('/requests/upload', authenticateToken.authenticateToken, upload.single('file'), requestController.uploadAndCreateRequest);

/**
 * @openapi
 * /api/requests/pending:
 *   get:
 *     tags: [Request]
 *     summary: Get all pending requests for current user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending requests
 */
router.get('/requests/pending', authenticateToken.authenticateToken, requestController.getPendingRequests);

/**
 * @openapi
 * /api/requests/approved:
 *   get:
 *     tags: [Request]
 *     summary: Get all approved requests for current user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of approved requests
 */
router.get('/requests/approved', authenticateToken.authenticateToken, requestController.getApprovedRequests);

/**
 * @openapi
 * /api/requests/{requestId}:
 *   get:
 *     tags: [Request]
 *     summary: Get request by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Request details
 */
router.get('/requests/:requestId', authenticateToken.authenticateToken, requestController.getRequestById);

/**
 * @openapi
 * /api/requests/{requestId}:
 *   patch:
 *     tags: [Request]
 *     summary: Update request status (approve/reject)
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
 *               status:
 *                 type: boolean
 *                 description: true for approve, false for reject
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Request status updated
 */
router.patch('/requests/:requestId', authenticateToken.authenticateToken, requestController.updateRequestStatus);

/**
 * @openapi
 * /api/requests/{requestId}:
 *   delete:
 *     tags: [Request]
 *     summary: Delete a request
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Request deleted successfully
 */
router.delete('/requests/:requestId', authenticateToken.authenticateToken, requestController.deleteRequest);

module.exports = router;
