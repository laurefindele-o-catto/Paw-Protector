const express = require('express');
const CareController = require('../controllers/careController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

const router = express.Router();
const careController = new CareController();
const authenticateToken = new AuthenticateToken();

// Vaccinations
router.post('/vaccinations', authenticateToken.authenticateToken, careController.addVaccination);
router.get('/vaccinations/:petId', authenticateToken.authenticateToken, careController.getVaccinationsByPet);

// Dewormings
router.post('/dewormings', authenticateToken.authenticateToken, careController.addDeworming);
router.get('/dewormings/:petId', authenticateToken.authenticateToken, careController.getDewormingsByPet);

// Reminders/Notifications
router.post('/reminder', authenticateToken.authenticateToken, careController.addReminder);
router.post('/notification', authenticateToken.authenticateToken, careController.addNotification);

module.exports = router;