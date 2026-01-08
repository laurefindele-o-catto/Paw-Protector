const VetApprovedModel = require('../models/vetApprovedModel.js');
const RequestModel = require('../models/requestModel.js');

class VetApprovedController {
    constructor() {
        this.vetApprovedModel = new VetApprovedModel();
        this.requestModel = new RequestModel();
    }

    /**
     * Vet approves a request with optional note
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    approveRequest = async (req, res) => {
        try {
            const vetId = req.user.id; // From JWT token
            const { requestId } = req.params;
            const { note } = req.body;

            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    error: 'Request ID is required'
                });
            }

            // Check if request exists
            const request = await this.requestModel.getRequestById(requestId);
            if (!request) {
                return res.status(404).json({
                    success: false,
                    error: 'Request not found'
                });
            }

            // Check if already approved
            const isAlreadyApproved = await this.vetApprovedModel.isRequestApproved(requestId);
            if (isAlreadyApproved) {
                return res.status(409).json({
                    success: false,
                    error: 'Request is already approved by a vet'
                });
            }

            // Create approval record (this also updates request status to true)
            const approval = await this.vetApprovedModel.approveRequest({
                vet_id: vetId,
                req_id: requestId,
                note: note || null
            });

            return res.status(201).json({
                success: true,
                message: 'Request approved successfully',
                approval
            });
        } catch (error) {
            console.error('Approve request error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Get approval details by request ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    getApprovalByRequestId = async (req, res) => {
        try {
            const { requestId } = req.params;

            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    error: 'Request ID is required'
                });
            }

            const approval = await this.vetApprovedModel.getApprovalByRequestId(requestId);
            if (!approval) {
                return res.status(404).json({
                    success: false,
                    error: 'Approval not found'
                });
            }

            return res.status(200).json({
                success: true,
                approval
            });
        } catch (error) {
            console.error('Get approval error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Get all approvals by the current vet
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    getMyApprovals = async (req, res) => {
        try {
            const vetId = req.user.id;

            const approvals = await this.vetApprovedModel.getApprovalsByVet(vetId);

            return res.status(200).json({
                success: true,
                approvals,
                count: approvals.length
            });
        } catch (error) {
            console.error('Get my approvals error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Get all approved requests (admin/moderator access)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    getAllApprovedRequests = async (req, res) => {
        try {
            const approvals = await this.vetApprovedModel.getAllApprovedRequests();

            return res.status(200).json({
                success: true,
                approvals,
                count: approvals.length
            });
        } catch (error) {
            console.error('Get all approved requests error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Update approval note
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    updateApprovalNote = async (req, res) => {
        try {
            const vetId = req.user.id;
            const { requestId } = req.params;
            const { note } = req.body;

            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    error: 'Request ID is required'
                });
            }

            if (!note) {
                return res.status(400).json({
                    success: false,
                    error: 'Note is required'
                });
            }

            const updatedApproval = await this.vetApprovedModel.updateApprovalNote(requestId, vetId, note);

            return res.status(200).json({
                success: true,
                message: 'Approval note updated successfully',
                approval: updatedApproval
            });
        } catch (error) {
            console.error('Update approval note error:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Internal server error'
            });
        }
    };

    /**
     * Revoke approval (delete approval record)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    revokeApproval = async (req, res) => {
        try {
            const vetId = req.user.id;
            const { requestId } = req.params;

            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    error: 'Request ID is required'
                });
            }

            const revoked = await this.vetApprovedModel.revokeApproval(requestId, vetId);
            if (!revoked) {
                return res.status(404).json({
                    success: false,
                    error: 'Approval not found or unauthorized'
                });
            }

            // Update request status back to false (pending)
            await this.requestModel.updateRequest(requestId, { status: false });

            return res.status(200).json({
                success: true,
                message: 'Approval revoked successfully'
            });
        } catch (error) {
            console.error('Revoke approval error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
}

module.exports = VetApprovedController;
