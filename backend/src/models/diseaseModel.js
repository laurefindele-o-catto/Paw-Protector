const DB_Connection = require('../database/db.js');

class DiseaseModel {
    constructor() {
        this.db_connection = new DB_Connection();
    }

    // Inserts a disease record for a pet
    addDisease = async (payload) => {
        try {
            const {
                pet_id, disease_name, symptoms, severity, status,
                diagnosed_on, resolved_on, vet_user_id, clinic_id, notes
            } = payload;
            const q = `
                INSERT INTO pet_diseases (
                    pet_id, disease_name, symptoms, severity, status,
                    diagnosed_on, resolved_on, vet_user_id, clinic_id, notes, created_at, updated_at
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW(), NOW()
                )
                RETURNING *;
            `;
            const p = [
                pet_id, disease_name, symptoms || null, severity || null, status || null,
                diagnosed_on || null, resolved_on || null, vet_user_id || null, clinic_id || null, notes || null
            ];
            const r = await this.db_connection.query_executor(q, p);
            return r.rows[0] || null;
        } catch (e) {
            console.log(`Disease insertion failed: ${e.message}`);
            return { success: false };
        }
    }

    // Lists all disease records for a pet
    getByPetId = async (petId) => {
        try {
            const q = `
                SELECT * FROM pet_diseases
                WHERE pet_id = $1
                ORDER BY diagnosed_on DESC NULLS LAST, id DESC
            `;
            const r = await this.db_connection.query_executor(q, [petId]);
            return r.rows || [];
        } catch (e) {
            console.log(`Get diseases by pet failed: ${e.message}`);
            return [];
        }
    }

    // Gets a single disease record by id
    getById = async (id) => {
        try {
            const q = `SELECT * FROM pet_diseases WHERE id = $1 LIMIT 1`;
            const r = await this.db_connection.query_executor(q, [id]);
            return r.rows[0] || null;
        } catch (e) {
            console.log(`Get disease by id failed: ${e.message}`);
            return null;
        }
    }

    // Updates fields on a disease record
    updateDisease = async (id, updates) => {
        try {
            const allowed = new Set([
                'disease_name','symptoms','severity','status',
                'diagnosed_on','resolved_on','vet_user_id','clinic_id','notes'
            ]);
            const sets = [];
            const vals = [];
            let i = 1;
            for (const [k, v] of Object.entries(updates || {})) {
                if (!allowed.has(k)) continue;
                sets.push(`${k} = $${i++}`);
                vals.push(v);
            }
            if (sets.length === 0) throw new Error('No valid value was sent');
            sets.push(`updated_at = NOW()`);
            const q = `
                UPDATE pet_diseases
                SET ${sets.join(', ')}
                WHERE id = $${i}
                RETURNING *;
            `;
            vals.push(id);
            const r = await this.db_connection.query_executor(q, vals);
            return r.rows[0] || null;
        } catch (e) {
            console.log(`Disease update failed: ${e.message}`);
            return { success: false };
        }
    }

    // Deletes a disease record
    deleteDisease = async (id) => {
        try {
            const q = `DELETE FROM pet_diseases WHERE id = $1 RETURNING id`;
            const r = await this.db_connection.query_executor(q, [id]);
            return r.rows[0] || null;
        } catch (e) {
            console.log(`Disease deletion failed: ${e.message}`);
            return { success: false };
        }
    }

    // Lists active diseases for a pet
    getActiveByPetId = async (petId) => {
        try {
            const q = `
                SELECT * FROM pet_diseases
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
}

module.exports = DiseaseModel;