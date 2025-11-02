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

    
    // Single JOIN query to fetch everything for a pet
    getSummaryJoined = async (petId) => {
        try {
            const q = `
                SELECT 
                  -- Pet
                  p.id AS pet_id,
                  p.owner_id AS pet_owner_id,
                  p.name AS pet_name,
                  p.species AS pet_species,
                  p.breed AS pet_breed,
                  p.sex AS pet_sex,
                  p.birthdate AS pet_birthdate,
                  p.weight_kg AS pet_weight_kg,
                  p.avatar_url AS pet_avatar_url,
                  p.is_neutered AS pet_is_neutered,
                  p.notes AS pet_notes,
                  p.created_at AS pet_created_at,
                  p.updated_at AS pet_updated_at,

                  -- Health metrics
                  phm.id AS health_metric_id,
                  phm.measured_at AS health_measured_at,
                  phm.weight_kg AS health_weight_kg,
                  phm.body_temp_c AS health_body_temp_c,
                  phm.heart_rate_bpm AS health_heart_rate_bpm,
                  phm.respiration_rate_bpm AS health_respiration_rate_bpm,
                  phm.note AS health_note,

                  -- Diseases
                  pd.id AS disease_id,
                  pd.disease_name AS disease_name,
                  pd.symptoms AS disease_symptoms,
                  pd.severity AS disease_severity,
                  pd.status AS disease_status,
                  pd.diagnosed_on AS disease_diagnosed_on,
                  pd.resolved_on AS disease_resolved_on,
                  pd.vet_user_id AS disease_vet_user_id,
                  pd.clinic_id AS disease_clinic_id,

                  -- Vaccinations
                  v.id AS vaccine_id,
                  v.vaccine_name AS vaccine_name,
                  v.dose_number AS vaccine_dose_number,
                  v.administered_on AS vaccine_administered_on,
                  v.due_on AS vaccine_due_on,
                  v.clinic_id AS vaccine_clinic_id,
                  v.vet_user_id AS vaccine_vet_user_id,
                  v.certificate_url AS vaccine_certificate_url,
                  v.notes AS vaccine_notes,

                  -- Dewormings
                  d.id AS deworm_id,
                  d.product_name AS deworm_product_name,
                  d.administered_on AS deworm_administered_on,
                  d.due_on AS deworm_due_on,
                  d.weight_based_dose AS deworm_weight_based_dose,
                  d.notes AS deworm_notes,
                  d.created_at AS deworm_created_at
                FROM pets AS p
                LEFT JOIN pet_health_metrics AS phm ON p.id = phm.pet_id
                LEFT JOIN pet_diseases AS pd ON p.id = pd.pet_id
                LEFT JOIN vaccinations AS v ON p.id = v.pet_id
                LEFT JOIN dewormings AS d ON p.id = d.pet_id
                WHERE p.id = $1
            `;
            const r = await this.db_connection.query_executor(q, [petId]);
            // console.log(r.rows);
            
            return r.rows || [];
        } catch (e) {
            console.log(`Get summary joined failed: ${e.message}`);
            return [];
        }
    }
}

module.exports = PetModel;