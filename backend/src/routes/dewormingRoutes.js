const express = require('express');
const DewormingController = require('../controllers/dewormingController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

const dewormingRouter = express.Router();
const dewormingController = new DewormingController();
const authenticateToken = new AuthenticateToken();

// Get all dewormings for a pet
dewormingRouter.get(
  '/pet/:petId',
  authenticateToken.authenticateToken,
  dewormingController.getByPet
);

// Add a new deworming record
dewormingRouter.post(
  '/',
  authenticateToken.authenticateToken,
  dewormingController.create
);

module.exports = {
  dewormingRouter
};