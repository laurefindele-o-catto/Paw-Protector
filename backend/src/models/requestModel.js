const DB_Connection = require('../database/db.js');

class RequestModel {
    constructor() {
        this.db = new DB_Connection();
    }

    /**
     * Create a new request
     * @param {Object} requestData - Request data (issue_user_id, content_url)
     * @returns {Promise<Object>} Created request with ID
     */
    async createRequest(requestData) {
        try {
            const { issue_user_id, content_url, status = false, notes } = requestData;

            if (!issue_user_id || !content_url) {
                throw new Error('issue_user_id and content_url are required');
            }

            const query = `
                INSERT INTO requests (issue_user_id, content_url, status, created_at, updated_at, notes)
                VALUES ($1, $2, $3, NOW(), NOW(), $4)
                RETURNING *
            `;

            const result = await this.db.query_executor(query, [issue_user_id, content_url, status, notes]);

            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to create request: ${error.message}`);
        }
    }

    /**
     * Update request when approved (set status to true)
     * @param {number} requestId - Request ID
     * @param {Object} updateData - Data to update (status)
     * @returns {Promise<Object>} Updated request
     */
    async updateRequest(requestId, updateData) {
        try {
            const { status, notes } = updateData;

            if (status === undefined) {
                throw new Error('status is required for update');
            }

            const query = `
            UPDATE requests
            SET
                status = $1,
                notes = $2,
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `;

            const result = await this.db.query_executor(query, [
                status,
                notes ?? null, // overwrite notes (AI → Vet)
                requestId,
            ]);

            if (!result.rows || result.rows.length === 0) {
                throw new Error('Request not found');
            }

            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to update request: ${error.message}`);
        }
    }

    /**
     * Get request by ID
     * @param {number} requestId - Request ID
     * @returns {Promise<Object|null>} Request data or null if not found
     */
    async getRequestById(requestId) {
        try {
            const query = `
                SELECT * FROM requests WHERE id = $1
            `;

            const results = await this.db.query_executor(query, [requestId]);

            return results.rows && results.rows.length > 0 ? results.rows[0] : null;
        } catch (error) {
            throw new Error(`Failed to get request: ${error.message}`);
        }
    }

    /**
     * Get all requests with status = false (pending requests)
     * @param {number} limit - Optional limit
     * @param {number} offset - Optional offset for pagination
     * @returns {Promise<Array>} Array of pending requests
     */
    async getPendingRequests(limit = null, offset = 0) {
        try {
            let query = `
                SELECT * FROM requests WHERE status = false ORDER BY created_at DESC
            `;

            const params = [];

            if (limit !== null) {
                query += ` LIMIT $1 OFFSET $2`;
                params.push(limit, offset);
            }

            const results = await this.db.query_executor(query, params);

            return results.rows;
        } catch (error) {
            throw new Error(`Failed to get pending requests: ${error.message}`);
        }
    }

    /**
     * Get all requests with status = true (approved requests)
     * @param {number} limit - Optional limit
     * @param {number} offset - Optional offset for pagination
     * @returns {Promise<Array>} Array of approved requests
     */
    async getApprovedRequests(limit = null, offset = 0) {
        try {
            let query = `
                SELECT * FROM requests WHERE status = true ORDER BY updated_at DESC
            `;

            const params = [];

            if (limit !== null) {
                query += ` LIMIT $1 OFFSET $2`;
                params.push(limit, offset);
            }

            const results = await this.db.query_executor(query, params);
            return results.rows;
        } catch (error) {
            throw new Error(`Failed to get approved requests: ${error.message}`);
        }
    }

    /**
     * Delete request by ID
     * @param {number} requestId - Request ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async deleteRequest(requestId) {
        try {
            const query = `
                DELETE FROM requests WHERE id = $1
            `;

            const result = await this.db.query_executor(query, [requestId]);

            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Failed to delete request: ${error.message}`);
        }
    }

    /**
     * Get pending requests for a specific user
     * @param {number} userId - User ID to filter by
     * @returns {Promise<Array>} Array of pending requests for the user
     */
    async getPendingRequestsGroupedByUser(userId) {
        try {
            let query = `
                SELECT * FROM requests 
                WHERE status = false AND issue_user_id = $1
                ORDER BY created_at DESC
            `;

            const params = [userId];
            const results = await this.db.query_executor(query, params);

            return results.rows;
        } catch (error) {
            throw new Error(`Failed to get pending requests: ${error.message}`);
        }
    }

    /**
     * Get approved requests for a specific user
     * @param {number} userId - User ID to filter by
     * @returns {Promise<Array>} Array of approved requests for the user
     */
    async getApprovedRequestsGroupedByUser(userId) {
        try {
            let query = `
                SELECT * FROM requests 
                WHERE status = true AND issue_user_id = $1
                ORDER BY created_at DESC
            `;

            const params = [userId];
            const results = await this.db.query_executor(query, params);

            return results.rows;
        } catch (error) {
            throw new Error(`Failed to get approved requests: ${error.message}`);
        }
    }
}

module.exports = RequestModel;
