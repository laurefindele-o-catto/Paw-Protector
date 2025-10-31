const DB_Connection = require('../database/db.js');
const db = new DB_Connection();

class DewormingController {
  // GET /api/dewormings/pet/:petId
  getByPet = async (req, res) => {
    try {
      const { petId } = req.params;
      const result = await db.query_executor(
        'SELECT * FROM dewormings WHERE pet_id=$1 ORDER BY administered_on DESC',
        [petId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Get dewormings failed:', err.message);
      res.status(500).json({ error: 'Failed to fetch dewormings' });
    }
  };

  // POST /api/dewormings
  create = async (req, res) => {
    try {
      const { pet_id, product_name, administered_on, weight_based_dose, notes } = req.body;

      // calc due date (+3 months)
      const date = new Date(administered_on);
      date.setMonth(date.getMonth() + 3);
      const due_on = date.toISOString().split('T')[0];

      const query = `
        INSERT INTO dewormings (pet_id, product_name, administered_on, due_on, weight_based_dose, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const params = [pet_id, product_name, administered_on, due_on, weight_based_dose, notes];
      const result = await db.query_executor(query, params);

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Deworming insert failed:', err.message);
      res.status(500).json({ error: 'Failed to insert deworming' });
    }
  };
}

module.exports = DewormingController;