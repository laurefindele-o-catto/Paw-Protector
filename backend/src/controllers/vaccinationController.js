const DB_Connection = require('../database/db.js');
const db = new DB_Connection();

class VaccinationController {
  // GET /api/vaccinations/pet/:petId
  getByPet = async (req, res) => {
    try {
      const { petId } = req.params;
      const result = await db.query_executor(
        'SELECT * FROM vaccinations WHERE pet_id=$1 ORDER BY administered_on DESC',
        [petId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Get vaccinations failed:', err.message);
      res.status(500).json({ error: 'Failed to fetch vaccinations' });
    }
  };

  // POST /api/vaccinations
  create = async (req, res) => {
    try {
      const { pet_id, vaccine_name, administered_on, notes } = req.body;

      // find last dose_number
      const last = await db.query_executor(
        'SELECT dose_number FROM vaccinations WHERE pet_id=$1 AND vaccine_name=$2 ORDER BY dose_number DESC LIMIT 1',
        [pet_id, vaccine_name]
      );
      const nextDose = last.rows.length ? last.rows[0].dose_number + 1 : 1;

      // calc due date (+1 year for rabies/flu)
      const date = new Date(administered_on);
      if (['Rabies', 'Flu'].includes(vaccine_name)) {
        date.setFullYear(date.getFullYear() + 1);
      }
      const due_on = date.toISOString().split('T')[0];

      const query = `
        INSERT INTO vaccinations (pet_id, vaccine_name, dose_number, administered_on, due_on, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const params = [pet_id, vaccine_name, nextDose, administered_on, due_on, notes];
      const result = await db.query_executor(query, params);

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Vaccination insert failed:', err.message);
      res.status(500).json({ error: 'Failed to insert vaccination' });
    }
  };
}

module.exports = VaccinationController;