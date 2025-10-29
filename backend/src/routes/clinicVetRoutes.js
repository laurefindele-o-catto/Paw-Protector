const express = require('express');
const ClinicVetController = require('../controllers/clinicVetController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js'); // fixed

const router = express.Router();
const controller = new ClinicVetController();
const authenticateToken = new AuthenticateToken();

// Add a clinic
router.post('/clinics', authenticateToken.authenticateToken, controller.addClinic);

// Add a vet profile
router.post('/vets', authenticateToken.authenticateToken, controller.addVet);

// Add a vet review
router.post('/vet-reviews', authenticateToken.authenticateToken, controller.addReview);

// Add an appointment
router.post('/appointments', authenticateToken.authenticateToken, controller.addAppointment);

module.exports = router;