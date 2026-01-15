const express = require('express');
const multer = require('multer');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const PetController = require('../controllers/petController.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const authenticateToken = new AuthenticateToken();
const petController = new PetController();

/**
 * @openapi
 * /api/pets:
 *   get:
 *     tags: [Pet]
 *     summary: List my pets
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pet'
 */
router.get('/pets', authenticateToken.authenticateToken, petController.getMyPets);

/**
 * @openapi
 * /api/pets/{petId}/summary:
 *   get:
 *     tags: [Pet]
 *     summary: Get pet summary
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Summary
 */
router.get('/pets/:petId/summary', authenticateToken.authenticateToken, petController.getPetSummary);

/**
 * @openapi
 * /api/pets/{petId}/medical-record:
 *   get:
 *     tags: [Pet]
 *     summary: Get pet medical record (all-time) for printing/sharing with vets
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Medical record
 */
router.get('/pets/:petId/medical-record', authenticateToken.authenticateToken, petController.getPetMedicalRecord);

/**
 * @openapi
 * /api/pets:
 *   post:
 *     tags: [Pet]
 *     summary: Add a new pet
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pet'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/pets', authenticateToken.authenticateToken, petController.addPet);

/**
 * @openapi
 * /api/pets/{petId}:
 *   patch:
 *     tags: [Pet]
 *     summary: Update pet info
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pet'
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch('/pets/:petId', authenticateToken.authenticateToken, petController.updatePet);

/**
 * @openapi
 * /api/pets/{petId}/metrics:
 *   post:
 *     tags: [Pet]
 *     summary: Add health metric
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PetMetric'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/pets/:petId/metrics', authenticateToken.authenticateToken, petController.addHealthMetric);

/**
 * @openapi
 * /api/pets/{petId}/avatar:
 *   post:
 *     tags: [Pet]
 *     summary: Upload pet avatar
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Uploaded
 */
router.post('/pets/:petId/avatar', authenticateToken.authenticateToken, upload.single('avatar'), petController.uploadPetAvatar);

module.exports = router;