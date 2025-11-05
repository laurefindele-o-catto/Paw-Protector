const express = require('express');
const CareController = require('../controllers/careController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

const careRouter = express.Router();
const careController = new CareController();
const authenticateToken = new AuthenticateToken();

careRouter.post('/care/vaccinations', authenticateToken.authenticateToken, careController.addVaccination);
careRouter.post('/care/dewormings', authenticateToken.authenticateToken, careController.addDeworming);

// Generate current week's plan (blocks if metrics not fresh)
careRouter.post('/care/plan/generate', authenticateToken.authenticateToken, careController.generatePlan);

// Get a plan by pet/week (defaults to current week)
careRouter.get('/care/plan', authenticateToken.authenticateToken, careController.getPlan);

// Get latest summary for a pet
careRouter.get('/care/summary', authenticateToken.authenticateToken, careController.getSummary);

module.exports = { careRouter };