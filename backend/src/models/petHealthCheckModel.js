const DB_Connection = require('../database/db.js');

class PetHealthCheckModel {
    constructor() {
        this.db = new DB_Connection();
    }

    async createRequest({ owner_user_id, vet_user_id, pet_id, problem_text, image_urls, health_profile }) {
        if (!owner_user_id || !vet_user_id || !problem_text) {
            throw new Error('owner_user_id, vet_user_id, and problem_text are required');
        }

        const query = `
            INSERT INTO pet_health_check_requests
              (owner_user_id, vet_user_id, pet_id, problem_text, image_urls, health_profile, status, created_at)
            VALUES
              ($1, $2, $3, $4, $5::jsonb, $6::jsonb, 'pending', NOW())
            RETURNING *;
        `;

        const params = [
            owner_user_id,
            vet_user_id,
            pet_id ?? null,
            problem_text,
            JSON.stringify(Array.isArray(image_urls) ? image_urls : []),
            JSON.stringify(health_profile ?? null),
        ];

        const result = await this.db.query_executor(query, params);
        return result.rows?.[0] || null;
    }

    async listMine(ownerUserId, limit = 25) {
        const lim = Math.min(Math.max(Number(limit || 25), 1), 100);
        const query = `
            SELECT r.*, u.username as vet_username, u.full_name as vet_full_name
            FROM pet_health_check_requests r
            LEFT JOIN users u ON r.vet_user_id = u.id
            WHERE r.owner_user_id = $1
            ORDER BY r.created_at DESC
            LIMIT $2;
        `;
        const result = await this.db.query_executor(query, [ownerUserId, lim]);
        return result.rows || [];
    }

    async listForVet(vetUserId, status = 'pending', limit = 25) {
        const lim = Math.min(Math.max(Number(limit || 25), 1), 100);
        const query = `
            SELECT r.*, u.username as owner_username, u.full_name as owner_full_name, p.name as pet_name
            FROM pet_health_check_requests r
            LEFT JOIN users u ON r.owner_user_id = u.id
            LEFT JOIN pets p ON r.pet_id = p.id
            WHERE r.vet_user_id = $1
              AND ($2::text IS NULL OR r.status = $2)
            ORDER BY r.created_at DESC
            LIMIT $3;
        `;
        const result = await this.db.query_executor(query, [vetUserId, status ?? null, lim]);
        return result.rows || [];
    }

    async getById(id) {
        const query = `
            SELECT
              r.*,
              ou.username as owner_username,
              ou.full_name as owner_full_name,
              vu.username as vet_username,
              vu.full_name as vet_full_name,
              p.name as pet_name,
              p.species as pet_species,
              p.breed as pet_breed,
              p.sex as pet_sex
            FROM pet_health_check_requests r
            LEFT JOIN users ou ON r.owner_user_id = ou.id
            LEFT JOIN users vu ON r.vet_user_id = vu.id
            LEFT JOIN pets p ON r.pet_id = p.id
            WHERE r.id = $1;
        `;
        const result = await this.db.query_executor(query, [id]);
        return result.rows?.[0] || null;
    }

    async respond({ id, vet_user_id, vet_response }) {
        const query = `
            UPDATE pet_health_check_requests
            SET status = 'responded',
                vet_response = $1,
                responded_at = NOW()
            WHERE id = $2 AND vet_user_id = $3
            RETURNING *;
        `;
        const result = await this.db.query_executor(query, [vet_response ?? null, id, vet_user_id]);
        return result.rows?.[0] || null;
    }

    async getVetPetSummary(vetUserId, limit = 50) {
        const lim = Math.min(Math.max(Number(limit || 50), 1), 200);
        const query = `
            SELECT
              r.pet_id,
              COALESCE(p.name, 'Unknown') as pet_name,
              COUNT(*)::int as total_checks,
              MAX(COALESCE(r.responded_at, r.created_at)) as last_activity_at
            FROM pet_health_check_requests r
            LEFT JOIN pets p ON r.pet_id = p.id
            WHERE r.vet_user_id = $1
              AND r.status = 'responded'
            GROUP BY r.pet_id, p.name
            ORDER BY last_activity_at DESC
            LIMIT $2;
        `;
        const result = await this.db.query_executor(query, [vetUserId, lim]);
        return result.rows || [];
    }

    async countForVet(vetUserId) {
        const query = `
            SELECT
              COUNT(*) FILTER (WHERE status='pending')::int as pending,
              COUNT(*) FILTER (WHERE status='responded')::int as responded
            FROM pet_health_check_requests
            WHERE vet_user_id = $1;
        `;
        const result = await this.db.query_executor(query, [vetUserId]);
        return result.rows?.[0] || { pending: 0, responded: 0 };
    }
}

module.exports = PetHealthCheckModel;
