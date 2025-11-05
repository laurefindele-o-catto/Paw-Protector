const express = require('express');
const multer = require('multer');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const PetController = require('../controllers/petController.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const authenticateToken = new AuthenticateToken();
const petController = new PetController();

// List my pets
router.get('/pets', authenticateToken.authenticateToken, petController.getMyPets);

// Pet summary
router.get('/pets/:petId/summary', authenticateToken.authenticateToken, petController.getPetSummary);

// Pet Add
router.post('/pets', authenticateToken.authenticateToken, petController.addPet);

// Update pet (basic info)
router.patch('/pets/:petId', authenticateToken.authenticateToken, petController.updatePet);

// Add health metric
router.post('/pets/:petId/metrics', authenticateToken.authenticateToken, petController.addHealthMetric);

// Upload pet avatar
router.post('/pets/:petId/avatar', authenticateToken.authenticateToken, upload.single('avatar'), petController.uploadPetAvatar);

module.exports = router;