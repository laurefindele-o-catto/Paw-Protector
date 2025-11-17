const express = require('express');
const ClinicVetController = require('../controllers/clinicVetController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js'); 

const router = express.Router();
const controller = new ClinicVetController();
const authenticateToken = new AuthenticateToken();

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
 * /api/vets/{user_id}:
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