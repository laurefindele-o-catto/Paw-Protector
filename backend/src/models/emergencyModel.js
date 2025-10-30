const DB_Connection = require('../database/db.js');

class EmergencyModel {
    constructor() {
        this.db = new DB_Connection();
    }

    createEmergencyRequest = async (data) => {
        try {
            const {
                pet_id, requester_user_id, clinic_id, description, status,
                accepted_by_vet_user_id, accepted_at, resolved_at,
                location_lat, location_lng, meta
            } = data;
            const query = `
                INSERT INTO emergency_requests (
                    pet_id, requester_user_id, clinic_id, description, status,
                    accepted_by_vet_user_id, accepted_at, resolved_at,
                    location_lat, location_lng, meta
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8,
                    $9, $10, $11
                )
                RETURNING *;
            `;
            const params = [
                pet_id, requester_user_id, clinic_id, description, status || 'open',
                accepted_by_vet_user_id, accepted_at, resolved_at,
                location_lat, location_lng, meta
            ];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Emergency request insert failed: ${error.message}`);
            return { success: false };
        }
    };

    // Optionally, add a method to get requests by user or status
    getRequestsByUser = async (user_id) => {
        try {
            const query = `
                SELECT * FROM emergency_requests
                WHERE requester_user_id = $1
                ORDER BY requested_at DESC;
            `;
            const result = await this.db.query_executor(query, [user_id]);
            return result.rows;
        } catch (error) {
            console.log(`Get emergency requests failed: ${error.message}`);
            return [];
        }
    };
}

module.exports = EmergencyModel;