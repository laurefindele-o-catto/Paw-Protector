const DB_Connection = require('../database/db.js');

class CareModel {
    constructor() {
        this.db_connection = new DB_Connection();
    }

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
            const result = await this.db_connection.query_executor(query, params);
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
            const result = await this.db_connection.query_executor(query, params);
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
            const result = await this.db_connection.query_executor(query, params);
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
            const result = await this.db_connection.query_executor(query, params);
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
            const r = await this.db_connection.query_executor(q, [pet_id, limit]);
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
            const r = await this.db_connection.query_executor(q, [pet_id, limit]);
            return r.rows || [];
        } catch (e) {
            console.log(`Get dewormings failed: ${e.message}`);
            return [];
        }
    };
}

module.exports = CareModel;