const express = require('express');
const CareController = require('../controllers/careController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');

const careRouter = express.Router();
const careController = new CareController();
const authenticateToken = new AuthenticateToken();

/**
 * @openapi
 * /api/care/vaccinations:
 *   post:
 *     tags: [Care]
 *     summary: Add vaccination record for a pet
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Vaccination'
 *     responses:
 *       201:
 *         description: Created
 */
careRouter.post('/care/vaccinations', authenticateToken.authenticateToken, careController.addVaccination);
/**
 * @openapi
 * /api/care/dewormings:
 *   post:
 *     tags: [Care]
 *     summary: Add deworming record for a pet
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Deworming'
 *     responses:
 *       201:
 *         description: Created
 */
careRouter.post('/care/dewormings', authenticateToken.authenticateToken, careController.addDeworming);

// Generate current week's plan (blocks if metrics not fresh)
/**
 * @openapi
 * /api/care/plan/generate:
 *   post:
 *     tags: [Care]
 *     summary: Generate current week's plan (requires fresh metrics)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pet_id: { type: integer }
 *     responses:
 *       201:
 *         description: Plan generated and saved
 *       412:
 *         description: Metrics not fresh
 */
careRouter.post('/care/plan/generate', authenticateToken.authenticateToken, careController.generatePlan);

// Get a plan by pet/week (defaults to current week)
/**
 * @openapi
 * /api/care/plan:
 *   get:
 *     tags: [Care]
 *     summary: Get a weekly plan by pet/week
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pet_id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: week_start
 *         required: false
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Care plan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarePlan'
 */
careRouter.get('/care/plan', authenticateToken.authenticateToken, careController.getPlan);

// Get latest summary for a pet
/**
 * @openapi
 * /api/care/summary:
 *   get:
 *     tags: [Care]
 *     summary: Get latest care summary for a pet
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pet_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CareSummary'
 */
careRouter.get('/care/summary', authenticateToken.authenticateToken, careController.getSummary);
// Get personalized vaccine timeline
/**
 * @openapi
 * /api/care/vaccine-timeline:
 *   get:
 *     tags: [Care]
 *     summary: Get personalized vaccine timeline
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pet_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Timeline
 * */
careRouter.get('/care/vaccine-timeline', authenticateToken.authenticateToken, careController.getVaccineTimeline);
// Get personalized life stage plan
/**
 * @openapi
 * /api/care/life-stages:
 *   get:
 *     tags: [Care]
 *     summary: Get personalized life stage plan
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pet_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Plan
 * */
careRouter.get('/care/life-stages', authenticateToken.authenticateToken, careController.getLifeStages);

// Vaccination/deworming history for VaccineAlert page (UI already calls these)
/**
 * @openapi
 * /api/care/vaccinations/{petId}:
 *   get:
 *     tags: [Care]
 *     summary: List vaccination records for a pet
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
 * */
careRouter.get('/care/vaccinations/:petId', authenticateToken.authenticateToken, careController.getVaccinationsByPet);
/**
 * @openapi
 * /api/care/dewormings/{petId}:
 *   get:
 *     tags: [Care]
 *     summary: List deworming records for a pet
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
 * */
careRouter.get('/care/dewormings/:petId', authenticateToken.authenticateToken, careController.getDewormingsByPet);

module.exports = { careRouter };