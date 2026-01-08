const express = require('express');
const CreateTables = require('../controllers/tableCreation.js');

const router = express.Router();
const createTables = new CreateTables();

/**
 * @openapi
 * /api/init-tables:
 *   post:
 *     tags: [System]
 *     summary: Initialize all database tables (ADMIN/DEV only)
 *     responses:
 *       200:
 *         description: Tables created or already exist
 */
router.post('/init-tables', createTables.createTables);

router.post('/req-tables_init',createTables.create_request_table);
router.post('/approval-tables_init',createTables.create_vet_approve_table);


module.exports = router;