const express = require('express');
const AnomalyController = require('../controllers/anomalyController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js'); // fixed
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const anomalyController = new AnomalyController();
const authenticateToken = new AuthenticateToken();

/**
 * @openapi
 * /api/anomaly/media:
 *   post:
 *     tags: [Anomaly]
 *     summary: Upload image for anomaly detection
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Uploaded
 */
router.post('/anomaly/media', authenticateToken.authenticateToken, upload.single('image'), anomalyController.uploadMedia);

/**
 * @openapi
 * /api/anomaly/job:
 *   post:
 *     tags: [Anomaly]
 *     summary: Create anomaly job
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/anomaly/job', authenticateToken.authenticateToken, anomalyController.createAnomalyJob);

/**
 * @openapi
 * /api/anomaly/result:
 *   post:
 *     tags: [Anomaly]
 *     summary: Store anomaly result
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Saved
 */
router.post('/anomaly/result', authenticateToken.authenticateToken, anomalyController.addAnomalyResult);

module.exports = router;