const express = require('express');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const PetHealthCheckController = require('../controllers/petHealthCheckController.js');

const router = express.Router();
const authenticateToken = new AuthenticateToken();
const controller = new PetHealthCheckController();

// Owner: upload images for health check (max 5)
router.post(
    '/health-checks/upload',
    authenticateToken.authenticateToken,
    controller.uploadMiddleware,
    controller.uploadImages
);

// Owner: create request
router.post('/health-checks', authenticateToken.authenticateToken, controller.create);

// Owner: list my requests
router.get('/health-checks/mine', authenticateToken.authenticateToken, controller.listMine);

// Owner/Vet: get a request by id (only owner or assigned vet)
router.get('/health-checks/:id', authenticateToken.authenticateToken, controller.getById);

// Vet: list pending assigned
router.get('/health-checks/vet/pending', authenticateToken.authenticateToken, controller.listVetPending);

// Vet: list all (optional ?status=pending|responded)
router.get('/health-checks/vet/all', authenticateToken.authenticateToken, controller.listVetAll);

// Vet: respond
router.patch('/health-checks/:id/respond', authenticateToken.authenticateToken, controller.respond);

// Vet: dashboard summary
router.get('/health-checks/vet/summary', authenticateToken.authenticateToken, controller.vetSummary);

module.exports = router;
