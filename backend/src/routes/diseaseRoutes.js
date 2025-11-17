const express = require('express');
const DiseaseController = require('../controllers/diseaseController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

const diseaseRouter = express.Router();
const diseaseController = new DiseaseController();
const authenticateToken = new AuthenticateToken();

/**
 * @openapi
 * /api/pets/{petId}/diseases:
 *   post:
 *     tags: [Disease]
 *     summary: Add a disease record for a pet
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
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
diseaseRouter.post('/pets/:petId/diseases', authenticateToken.authenticateToken, diseaseController.addDisease);
/**
 * @openapi
 * /api/pets/{petId}/diseases:
 *   get:
 *     tags: [Disease]
 *     summary: List diseases for a pet
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Records
 */
diseaseRouter.get('/pets/:petId/diseases', authenticateToken.authenticateToken, diseaseController.listForPet);
/**
 * @openapi
 * /api/pets/{petId}/diseases/active:
 *   get:
 *     tags: [Disease]
 *     summary: List active diseases for a pet
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: petId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Records
 */
diseaseRouter.get('/pets/:petId/diseases/active', authenticateToken.authenticateToken, diseaseController.listActiveForPet);
/**
 * @openapi
 * /api/diseases/{id}:
 *   get:
 *     tags: [Disease]
 *     summary: Get a disease record by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Disease
 */
diseaseRouter.get('/diseases/:id', authenticateToken.authenticateToken, diseaseController.getOne);
/**
 * @openapi
 * /api/diseases/{id}:
 *   patch:
 *     tags: [Disease]
 *     summary: Update a disease record by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 */
diseaseRouter.patch('/diseases/:id', authenticateToken.authenticateToken, diseaseController.updateOne);
/**
 * @openapi
 * /api/diseases/{id}:
 *   delete:
 *     tags: [Disease]
 *     summary: Delete a disease record by id
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
diseaseRouter.delete('/diseases/:id', authenticateToken.authenticateToken, diseaseController.deleteOne);

module.exports = { diseaseRouter };