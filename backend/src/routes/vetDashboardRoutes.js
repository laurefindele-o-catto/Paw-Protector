const express = require('express');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const VetDashboardController = require('../controllers/vetDashboardController.js');

const router = express.Router();
const authenticateToken = new AuthenticateToken();
const controller = new VetDashboardController();

router.get('/vet-dashboard/overview', authenticateToken.authenticateToken, controller.overview);

module.exports = router;
