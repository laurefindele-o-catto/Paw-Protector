const DB_Connection = require('../database/db.js');

class VetDeclinedModel {
    constructor() {
        this.db = new DB_Connection();
    }

    async declineRequest({ vet_id, req_id, correct_diagnosis, note }) {
        if (!vet_id || !req_id) throw new Error('vet_id and req_id are required');

        const query = `
            WITH inserted_decline AS (
                INSERT INTO vet_declined (vet_id, req_id, correct_diagnosis, note, declined_at)
                VALUES ($1, $2, $3, $4, NOW())
                RETURNING *
            ),
            updated_request AS (
                UPDATE requests
                SET status = true,
                    notes = COALESCE($3, notes),
                    updated_at = NOW()
                WHERE id = $2
                RETURNING id
            )
            SELECT * FROM inserted_decline;
        `;

        const result = await this.db.query_executor(query, [
            vet_id,
            req_id,
            correct_diagnosis ?? null,
            note ?? null,
        ]);
        return result.rows?.[0] || null;
    }

    async getDeclineByRequestId(reqId) {
        const query = `
            SELECT vd.*, r.content_url, r.issue_user_id, r.created_at as request_created_at,
                   u.username as requester_username
            FROM vet_declined vd
            JOIN requests r ON vd.req_id = r.id
            JOIN users u ON r.issue_user_id = u.id
            WHERE vd.req_id = $1
        `;

        const result = await this.db.query_executor(query, [reqId]);
        return result.rows?.[0] || null;
    }

    async getDeclinesByVet(vetId, limit = 25) {
        const lim = Math.min(Math.max(Number(limit || 25), 1), 100);
        const query = `
            SELECT vd.*, r.content_url, r.issue_user_id, r.created_at as request_created_at,
                   u.username as requester_username
            FROM vet_declined vd
            JOIN requests r ON vd.req_id = r.id
            JOIN users u ON r.issue_user_id = u.id
            WHERE vd.vet_id = $1
            ORDER BY vd.declined_at DESC
            LIMIT $2
        `;

        const result = await this.db.query_executor(query, [vetId, lim]);
        return result.rows || [];
    }

    async isRequestDeclined(reqId) {
        const query = `SELECT 1 FROM vet_declined WHERE req_id = $1 LIMIT 1`;
        const result = await this.db.query_executor(query, [reqId]);
        return result.rowCount > 0;
    }
}

module.exports = VetDeclinedModel;
