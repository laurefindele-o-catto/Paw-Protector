const DB_Connection = require('../database/db.js');

class VetApprovedModel {
    constructor() {
        this.db = new DB_Connection();
    }

    /**
     * Approve a request by a vet and update request status to true
     * @param {Object} approvalData - { vet_id, req_id, note }
     * @returns {Promise<Object>} Approved request record
     */
    async approveRequest(approvalData) {
        try {
            const { vet_id, req_id, note } = approvalData;

            if (!vet_id || !req_id) {
                throw new Error('vet_id and req_id are required');
            }

            // Insert approval and update request status in a single transaction
            const query = `
                WITH inserted_approval AS (
                    INSERT INTO vet_approved (vet_id, req_id, note, approved_at)
                    VALUES ($1, $2, $3, NOW())
                    RETURNING *
                ),
                updated_request AS (
                    UPDATE requests
                    SET status = true
                    WHERE id = $2
                    RETURNING id, status
                )
                SELECT * FROM inserted_approval
            `;

            const result = await this.db.query_executor(query, [vet_id, req_id, note || null]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to approve request: ${error.message}`);
        }
    }

    /**
     * Get approval by request ID
     * @param {number} reqId - Request ID
     * @returns {Promise<Object|null>} Approval record or null
     */
    async getApprovalByRequestId(reqId) {
        try {
            const query = `
                SELECT va.*, v.name as vet_name, r.content_url, r.issue_user_id, r.created_at as request_created_at
                FROM vet_approved va
                JOIN vets v ON va.vet_id = v.user_id
                JOIN requests r ON va.req_id = r.id
                WHERE va.req_id = $1
            `;

            const result = await this.db.query_executor(query, [reqId]);
            return result.rows && result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            throw new Error(`Failed to get approval: ${error.message}`);
        }
    }

    /**
     * Get all approvals by a specific vet
     * @param {number} vetId - Vet user ID
     * @returns {Promise<Array>} Array of approvals
     */
    async getApprovalsByVet(vetId) {
        try {
            const query = `
                SELECT va.*, r.content_url, r.issue_user_id, r.created_at as request_created_at, u.username as requester_username
                FROM vet_approved va
                JOIN requests r ON va.req_id = r.id
                JOIN users u ON r.issue_user_id = u.id
                WHERE va.vet_id = $1
                ORDER BY va.approved_at DESC
            `;

            const result = await this.db.query_executor(query, [vetId]);
            return result.rows || [];
        } catch (error) {
            throw new Error(`Failed to get vet approvals: ${error.message}`);
        }
    }

    /**
     * Get all approved requests with vet details
     * @returns {Promise<Array>} Array of all approved requests
     */
    async getAllApprovedRequests() {
        try {
            const query = `
                SELECT va.*, v.name as vet_name, r.content_url, r.issue_user_id, r.created_at as request_created_at, u.username as requester_username
                FROM vet_approved va
                JOIN vets v ON va.vet_id = v.user_id
                JOIN requests r ON va.req_id = r.id
                JOIN users u ON r.issue_user_id = u.id
                ORDER BY va.approved_at DESC
            `;

            const result = await this.db.query_executor(query);
            return result.rows || [];
        } catch (error) {
            throw new Error(`Failed to get all approved requests: ${error.message}`);
        }
    }

    /**
     * Update approval note
     * @param {number} reqId - Request ID
     * @param {number} vetId - Vet user ID
     * @param {string} note - Updated note
     * @returns {Promise<Object>} Updated approval record
     */
    async updateApprovalNote(reqId, vetId, note) {
        try {
            const query = `
                UPDATE vet_approved
                SET note = $1
                WHERE req_id = $2 AND vet_id = $3
                RETURNING *
            `;

            const result = await this.db.query_executor(query, [note, reqId, vetId]);
            
            if (!result.rows || result.rows.length === 0) {
                throw new Error('Approval not found or unauthorized');
            }

            return result.rows[0];
        } catch (error) {
            throw new Error(`Failed to update approval note: ${error.message}`);
        }
    }

    /**
     * Delete/revoke approval
     * @param {number} reqId - Request ID
     * @param {number} vetId - Vet user ID (to ensure only approving vet can revoke)
     * @returns {Promise<boolean>} True if deleted
     */
    async revokeApproval(reqId, vetId) {
        try {
            const query = `
                DELETE FROM vet_approved
                WHERE req_id = $1 AND vet_id = $2
            `;

            const result = await this.db.query_executor(query, [reqId, vetId]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Failed to revoke approval: ${error.message}`);
        }
    }

    /**
     * Check if a request is already approved
     * @param {number} reqId - Request ID
     * @returns {Promise<boolean>} True if already approved
     */
    async isRequestApproved(reqId) {
        try {
            const query = `
                SELECT 1 FROM vet_approved WHERE req_id = $1 LIMIT 1
            `;

            const result = await this.db.query_executor(query, [reqId]);
            return result.rowCount > 0;
        } catch (error) {
            throw new Error(`Failed to check approval status: ${error.message}`);
        }
    }
}

module.exports = VetApprovedModel;
