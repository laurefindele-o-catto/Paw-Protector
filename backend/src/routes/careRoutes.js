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
// Get personalized vaccine timeline
careRouter.get('/care/vaccine-timeline', authenticateToken.authenticateToken, careController.getVaccineTimeline);
// Get personalized life stage plan
careRouter.get('/care/life-stages', authenticateToken.authenticateToken, careController.getLifeStages);

// Vaccination/deworming history for VaccineAlert page (UI already calls these)
careRouter.get('/care/vaccinations/:petId', authenticateToken.authenticateToken, careController.getVaccinationsByPet);
careRouter.get('/care/dewormings/:petId', authenticateToken.authenticateToken, careController.getDewormingsByPet);

module.exports = { careRouter };