const DB_Connection = require('../database/db.js');

class PetModel {
    constructor() {
        this.db_connection = new DB_Connection();
    }

    // Creates a pet
    createPet = async (petData) => {
        try {
            const {
                owner_id, name, species, breed, sex,
                birthdate, weight_kg, avatar_url, is_neutered, notes
            } = petData;

            const query = `
                INSERT INTO pets (
                    owner_id, name, species, breed, sex, birthdate,
                    weight_kg, avatar_url, is_neutered, notes
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    $7, $8, $9, $10
                )
                RETURNING id, owner_id, name, species, breed, sex, birthdate,
                          weight_kg, avatar_url, is_neutered, notes, created_at, updated_at;
            `;
            const params = [
                owner_id, name, species, breed, sex,
                birthdate, weight_kg, avatar_url, !!is_neutered, notes
            ];
            const result = await this.db_connection.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Pet insertion failed: ${error.message}`);
            return { success: false };
        }
    };

    // Returns pet by id
    getPetById = async (petId) => {
        try {
            const q = `SELECT * FROM pets WHERE id = $1 LIMIT 1`;
            const r = await this.db_connection.query_executor(q, [petId]);
            return r.rows[0] || null;
        } catch (e) {
            console.log(`Get pet by id failed: ${e.message}`);
            return null;
        }
    };

    // Updates avatar_url
    updatePetAvatar = async (petId, avatarUrl) => {
        try {
            const q = `
                UPDATE pets
                SET avatar_url = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING id, owner_id, name, species, breed, sex, birthdate,
                          weight_kg, avatar_url, is_neutered, notes, created_at, updated_at;
            `;
            const r = await this.db_connection.query_executor(q, [avatarUrl, petId]);
            return r.rows[0] || null;
        } catch (e) {
            console.log(`Update pet avatar failed: ${e.message}`);
            return null;
        }
    };

    // Lists pets by owner
    getPetsByOwner = async (owner_id) => {
        try {
            const query = `
                SELECT * FROM pets WHERE owner_id = $1 ORDER BY created_at DESC;
            `;
            const result = await this.db_connection.query_executor(query, [owner_id]);
            return result.rows;
        } catch (error) {
            console.log(`Get pets failed: ${error.message}`);
            return [];
        }
    };

    // Returns latest health metrics rows for a pet
    getLatestHealthMetrics = async (petId, limit = 7) => {
        try {
            const q = `
                SELECT measured_at, weight_kg, body_temp_c, heart_rate_bpm, respiration_rate_bpm
                FROM pet_health_metrics
                WHERE pet_id = $1
                ORDER BY measured_at DESC
                LIMIT $2
            `;
            const r = await this.db_connection.query_executor(q, [petId, limit]);
            return r.rows || [];
        } catch (e) {
            console.log(`Get latest health metrics failed: ${e.message}`);
            return [];
        }
    }

    // Returns active diseases for a pet
    getActiveDiseases = async (petId) => {
        try {
            const q = `
                SELECT id, disease_name, symptoms, severity, status, diagnosed_on, notes
                FROM pet_diseases
                WHERE pet_id = $1 AND status = 'active'
                ORDER BY diagnosed_on DESC NULLS LAST, id DESC
            `;
            const r = await this.db_connection.query_executor(q, [petId]);
            return r.rows || [];
        } catch (e) {
            console.log(`Get active diseases failed: ${e.message}`);
            return [];
        }
    }

    // Returns recent vaccinations for a pet
    getRecentVaccinations = async (petId, limit = 5) => {
        try {
            const q = `
                SELECT id, vaccine_name, dose_number, administered_on, due_on, notes
                FROM vaccinations
                WHERE pet_id = $1
                ORDER BY administered_on DESC NULLS LAST, id DESC
                LIMIT $2
            `;
            const r = await this.db_connection.query_executor(q, [petId, limit]);
            return r.rows || [];
        } catch (e) {
            console.log(`Get recent vaccinations failed: ${e.message}`);
            return [];
        }
    }

    // Returns next due vaccination for a pet
    getNextDueVaccination = async (petId) => {
        try {
            const q = `
                SELECT id, vaccine_name, dose_number, administered_on, due_on, notes
                FROM vaccinations
                WHERE pet_id = $1 AND due_on IS NOT NULL AND due_on >= CURRENT_DATE
                ORDER BY due_on ASC
                LIMIT 1
            `;
            const r = await this.db_connection.query_executor(q, [petId]);
            return r.rows[0] || null;
        } catch (e) {
            console.log(`Get next due vaccination failed: ${e.message}`);
            return null;
        }
    }

    // Returns recent dewormings for a pet
    getRecentDewormings = async (petId, limit = 3) => {
        try {
            const q = `
                SELECT id, product_name, administered_on, due_on, notes
                FROM dewormings
                WHERE pet_id = $1
                ORDER BY administered_on DESC NULLS LAST, id DESC
                LIMIT $2
            `;
            const r = await this.db_connection.query_executor(q, [petId, limit]);
            return r.rows || [];
        } catch (e) {
            console.log(`Get recent dewormings failed: ${e.message}`);
            return [];
        }
    }

    // Returns next due deworming for a pet
    getNextDueDeworming = async (petId) => {
        try {
            const q = `
                SELECT id, product_name, administered_on, due_on, notes
                FROM dewormings
                WHERE pet_id = $1 AND due_on IS NOT NULL AND due_on >= CURRENT_DATE
                ORDER BY due_on ASC
                LIMIT 1
            `;
            const r = await this.db_connection.query_executor(q, [petId]);
            return r.rows[0] || null;
        } catch (e) {
            console.log(`Get next due deworming failed: ${e.message}`);
            return null;
        }
    }
}

module.exports = PetModel;