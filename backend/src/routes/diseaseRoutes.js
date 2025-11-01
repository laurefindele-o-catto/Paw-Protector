const express = require('express');
const DiseaseController = require('../controllers/diseaseController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

const diseaseRouter = express.Router();
const diseaseController = new DiseaseController();
const authenticateToken = new AuthenticateToken();

diseaseRouter.post('/pets/:petId/diseases', authenticateToken.authenticateToken, diseaseController.addDisease);
diseaseRouter.get('/pets/:petId/diseases', authenticateToken.authenticateToken, diseaseController.listForPet);
diseaseRouter.get('/pets/:petId/diseases/active', authenticateToken.authenticateToken, diseaseController.listActiveForPet);
diseaseRouter.get('/diseases/:id', authenticateToken.authenticateToken, diseaseController.getOne);
diseaseRouter.patch('/diseases/:id', authenticateToken.authenticateToken, diseaseController.updateOne);
diseaseRouter.delete('/diseases/:id', authenticateToken.authenticateToken, diseaseController.deleteOne);

module.exports = { diseaseRouter };