const DB_Connection = require('../database/db.js');

class CareModel {
  constructor() {
    this.db = new DB_Connection();
    this.ensureTables().catch(() => {});
  }

  ensureTables = async () => {
    const ddl = `
      CREATE TABLE IF NOT EXISTS care_plans (
        id SERIAL PRIMARY KEY,
        pet_id INTEGER NOT NULL,
        week_start DATE NOT NULL,
        summary_json JSONB NOT NULL,
        plan_json JSONB NOT NULL,
        sources JSONB NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (pet_id, week_start)
      );
    `;
    await this.db.query_executor(ddl);
  };

  // Vaccination
  addVaccination = async (data) => {
    try {
      const {
        pet_id, vaccine_name, dose_number, administered_on, due_on,
        clinic_id, vet_user_id, certificate_url, notes
      } = data;
      const query = `
        INSERT INTO vaccinations (
          pet_id, vaccine_name, dose_number, administered_on, due_on,
          clinic_id, vet_user_id, certificate_url, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        RETURNING *;
      `;
      const params = [
        pet_id, vaccine_name, dose_number, administered_on, due_on,
        clinic_id, vet_user_id, certificate_url, notes
      ];
      const result = await this.db.query_executor(query, params);
      return result.rows[0];
    } catch (error) {
      console.log(`Vaccination insert failed: ${error.message}`);
      return { success: false };
    }
  };

  // Deworming
  addDeworming = async (data) => {
    try {
      const {
        pet_id, product_name, administered_on, due_on, weight_based_dose, notes
      } = data;
      const query = `
        INSERT INTO dewormings (
          pet_id, product_name, administered_on, due_on, weight_based_dose, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )
        RETURNING *;
      `;
      const params = [
        pet_id, product_name, administered_on, due_on, weight_based_dose, notes
      ];
      const result = await this.db.query_executor(query, params);
      return result.rows[0];
    } catch (error) {
      console.log(`Deworming insert failed: ${error.message}`);
      return { success: false };
    }
  };

  // Reminder Schedule
  addReminder = async (data) => {
    try {
      const {
        user_id, pet_id, type, title, description, start_at, rrule, timezone, is_active
      } = data;
      const query = `
        INSERT INTO reminder_schedules (
          user_id, pet_id, type, title, description, start_at, rrule, timezone, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        RETURNING *;
      `;
      const params = [
        user_id, pet_id, type, title, description, start_at, rrule, timezone, is_active
      ];
      const result = await this.db.query_executor(query, params);
      return result.rows[0];
    } catch (error) {
      console.log(`Reminder insert failed: ${error.message}`);
      return { success: false };
    }
  };

  // Notification
  addNotification = async (data) => {
    try {
      const {
        user_id, title, body, scheduled_for, sent_at, read_at, meta
      } = data;
      const query = `
        INSERT INTO notifications (
          user_id, title, body, scheduled_for, sent_at, read_at, meta
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        )
        RETURNING *;
      `;
      const params = [
        user_id, title, body, scheduled_for, sent_at, read_at, meta
      ];
      const result = await this.db.query_executor(query, params);
      return result.rows[0];
    } catch (error) {
      console.log(`Notification insert failed: ${error.message}`);
      return { success: false };
    }
  };

  // List vaccinations for a pet (recent first)
  getVaccinationsByPet = async (pet_id, limit = 10) => {
    try {
      const q = `
        SELECT * FROM vaccinations
        WHERE pet_id = $1
        ORDER BY administered_on DESC NULLS LAST, id DESC
        LIMIT $2;
      `;
      const r = await this.db.query_executor(q, [pet_id, limit]);
      return r.rows || [];
    } catch (e) {
      console.log(`Get vaccinations failed: ${e.message}`);
      return [];
    }
  };

  // List dewormings for a pet (recent first)
  getDewormingsByPet = async (pet_id, limit = 10) => {
    try {
      const q = `
        SELECT * FROM dewormings
        WHERE pet_id = $1
        ORDER BY administered_on DESC NULLS LAST, id DESC
        LIMIT $2;
      `;
      const r = await this.db.query_executor(q, [pet_id, limit]);
      return r.rows || [];
    } catch (e) {
      console.log(`Get dewormings failed: ${e.message}`);
      return [];
    }
  };

  upsertCarePlan = async ({ pet_id, week_start, summary_json, plan_json, sources }) => {
    const q = `
      INSERT INTO care_plans (pet_id, week_start, summary_json, plan_json, sources)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (pet_id, week_start)
      DO UPDATE SET summary_json = EXCLUDED.summary_json,
                    plan_json = EXCLUDED.plan_json,
                    sources = EXCLUDED.sources,
                    updated_at = NOW()
      RETURNING *;
    `;
    const rs = await this.db.query_executor(q, [pet_id, week_start, summary_json, plan_json, sources || null]);
    return rs.rows?.[0];
  };

  getCarePlan = async ({ pet_id, week_start }) => {
    const q = `SELECT * FROM care_plans WHERE pet_id = $1 AND week_start = $2 LIMIT 1`;
    const rs = await this.db.query_executor(q, [pet_id, week_start]);
    return rs.rows?.[0] || null;
  };

  getLatestCarePlan = async (pet_id) => {
    const q = `SELECT * FROM care_plans WHERE pet_id = $1 ORDER BY week_start DESC LIMIT 1`;
    const rs = await this.db.query_executor(q, [pet_id]);
    return rs.rows?.[0] || null;
  };

  getLastMetricUpdatedAt = async (pet_id) => {
    const q = `
      SELECT MAX(COALESCE(measured_at)) AS last_updated
      FROM pet_health_metrics
      WHERE pet_id = $1
    `;
    const rs = await this.db.query_executor(q, [pet_id]);
    return rs.rows?.[0]?.last_updated || null;
  };
}

module.exports = CareModel;