const express = require('express');
const CreateTables = require('../controllers/tableCreation.js');

const router = express.Router();
const createTables = new CreateTables();

// Route to initialize all tables
router.post('/init-tables', createTables.createTables);

module.exports = router;