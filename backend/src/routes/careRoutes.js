const express = require('express');
const CareController = require('../controllers/careController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js'); // fixed

const router = express.Router();
const careController = new CareController();
const authenticateToken = new AuthenticateToken();

// Vaccination
router.post('/care/vaccination', authenticateToken.authenticateToken, careController.addVaccination);

// Deworming
router.post('/care/deworming', authenticateToken.authenticateToken, careController.addDeworming);

// Reminder
router.post('/care/reminder', authenticateToken.authenticateToken, careController.addReminder);

// Notification
router.post('/care/notification', authenticateToken.authenticateToken, careController.addNotification);

// Vaccination
router.get('/care/vaccinations/:petId', authenticateToken.authenticateToken, careController.getVaccinationsByPet);

// Deworming
router.get('/care/dewormings/:petId', authenticateToken.authenticateToken, careController.getDewormingsByPet);

module.exports = router;