const express = require('express');
const AnomalyController = require('../controllers/anomalyController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js'); // fixed
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const anomalyController = new AnomalyController();
const authenticateToken = new AuthenticateToken();

// Upload image for anomaly detection
router.post('/anomaly/media', authenticateToken.authenticateToken, upload.single('image'), anomalyController.uploadMedia);

// Create anomaly job
router.post('/anomaly/job', authenticateToken.authenticateToken, anomalyController.createAnomalyJob);

// Store anomaly result
router.post('/anomaly/result', authenticateToken.authenticateToken, anomalyController.addAnomalyResult);

module.exports = router;