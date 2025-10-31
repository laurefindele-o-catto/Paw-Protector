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
}

module.exports = PetModel;