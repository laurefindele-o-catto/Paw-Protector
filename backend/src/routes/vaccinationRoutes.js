const express = require('express');
const VaccinationController = require('../controllers/vaccinationController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

const vaccinationRouter = express.Router();
const vaccinationController = new VaccinationController();
const authenticateToken = new AuthenticateToken();

// Get all vaccinations for a pet
vaccinationRouter.get(
  '/pet/:petId',
  authenticateToken.authenticateToken,
  vaccinationController.getByPet
);

// Add a new vaccination record
vaccinationRouter.post(
  '/',
  authenticateToken.authenticateToken,
  vaccinationController.create
);

module.exports = {
  vaccinationRouter
};