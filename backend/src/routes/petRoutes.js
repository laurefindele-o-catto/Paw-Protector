const express = require('express');
const PetController = require('../controllers/petController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const multer = require('multer');

const router = express.Router();
const petController = new PetController();
const authenticateToken = new AuthenticateToken();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Add a pet
router.post('/pets', authenticateToken.authenticateToken, petController.addPet);

// Get all pets for logged-in user
router.get('/pets', authenticateToken.authenticateToken, petController.getMyPets);

// Upload pet avatar
router.post('/pets/:petId/avatar', authenticateToken.authenticateToken, upload.single('avatar'), petController.uploadAvatar);

module.exports = router;