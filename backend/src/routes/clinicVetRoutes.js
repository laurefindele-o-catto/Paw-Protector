const express = require('express');
const ClinicVetController = require('../controllers/clinicVetController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js'); 

const router = express.Router();
const controller = new ClinicVetController();
const authenticateToken = new AuthenticateToken();

/**
 * @openapi
 * /api/clinics/nearby:
 *   get:
 *     tags: [Clinic/Vet]
 *     summary: List nearby vet clinics (by lat/lng)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Nearby clinics
 */
router.get('/clinics/nearby', authenticateToken.authenticateToken, controller.listNearbyClinics);

/**
 * @openapi
 * /api/clinics:
 *   post:
 *     tags: [Clinic/Vet]
 *     summary: Add a clinic
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Clinic'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/clinics', authenticateToken.authenticateToken, controller.addClinic);

/**
 * @openapi
 * /api/vets:
 *   post:
 *     tags: [Clinic/Vet]
 *     summary: Add a vet profile
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vet'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/vets', authenticateToken.authenticateToken, controller.addVet);

/**
 * @openapi
 * /api/vets:
 *   get:
 *     tags: [Clinic/Vet]
 *     summary: List vet profiles (for selection)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: verified
 *         required: false
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List
 */
router.get('/vets', authenticateToken.authenticateToken, controller.listVets);

/**
 * @openapi
 * /api/vets/{user_id}:
 *   get:
 *     tags: [Clinic/Vet]
 *     summary: Get a vet profile
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 *   patch:
 *     tags: [Clinic/Vet]
 *     summary: Update a vet profile
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vet'
 *     responses:
 *       200:
 *         description: Updated
 */
router.get('/vets/:user_id', authenticateToken.authenticateToken, controller.getVet);
router.patch('/vets/:user_id', authenticateToken.authenticateToken, controller.updateVet);

/**
 * @openapi
 * /api/vet-reviews:
 *   post:
 *     tags: [Clinic/Vet]
 *     summary: Add a vet review
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/vet-reviews', authenticateToken.authenticateToken, controller.addReview);

/**
 * @openapi
 * /api/appointments:
 *   post:
 *     tags: [Clinic/Vet]
 *     summary: Add an appointment
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/appointments', authenticateToken.authenticateToken, controller.addAppointment);

module.exports = router;