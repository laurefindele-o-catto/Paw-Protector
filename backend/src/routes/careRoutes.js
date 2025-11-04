const express = require('express');
const CareController = require('../controllers/careController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

const careRouter = express.Router();
const careController = new CareController();
const authenticateToken = new AuthenticateToken();

careRouter.post('/care/vaccinations', authenticateToken.authenticateToken, careController.addVaccination);
careRouter.post('/care/dewormings', authenticateToken.authenticateToken, careController.addDeworming);

module.exports = { careRouter };