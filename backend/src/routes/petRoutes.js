const express = require('express');
const PetController = require('../controllers/petController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js'); // fixed

const router = express.Router();
const petController = new PetController();
const authenticateToken = new AuthenticateToken();

// TODO: Keep the file upload feature

// Add a pet
router.post('/pets', authenticateToken.authenticateToken, petController.addPet);

// Get all pets for logged-in user
router.get('/pets', authenticateToken.authenticateToken, petController.getMyPets);

module.exports = router;