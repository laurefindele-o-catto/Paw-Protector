const RequestModel = require('../models/requestModel.js');
const multer = require('multer');
const { uploadRequestContentBuffer } = require('../utils/cloudinary.js');

const upload = multer({ storage: multer.memoryStorage() });

class RequestController {
    constructor() {
        this.model = new RequestModel();
    }

    /**
     * Create a new request
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    createRequest = async (req, res) => {
        try {
            const userId = req.user.id;
            const { content_url } = req.body;

            if (!content_url) {
                return res.status(400).json({
                    success: false,
                    error: 'content_url is required'
                });
            }

            const requestData = {
                issue_user_id: userId,
                content_url: content_url,
                status: false
            };

            const newRequest = await this.model.createRequest(requestData);
            if (!newRequest) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create request'
                });
            }

            return res.status(201).json({
                success: true,
                request: newRequest
            });
        } catch (error) {
            console.error('Create request error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Upload request content (image/file) to Cloudinary and create request
     * @param {Object} req - Express request object with file
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    uploadAndCreateRequest = async (req, res) => {
        try {
            const userId = req.user.id;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: 'File is required'
                });
            }

            // Validate file type (images and PDFs)
            if (!/^(image\/(png|jpe?g|webp)|application\/pdf)$/i.test(file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    error: 'Unsupported file type. Only images (PNG, JPEG, WebP) and PDFs are allowed'
                });
            }

            // Upload to Cloudinary
            const result = await uploadRequestContentBuffer(file.buffer, userId);
            if (!result || !result.secure_url) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to upload file'
                });
            }

            // Create request with the uploaded URL
            const requestData = {
                issue_user_id: userId,
                content_url: result.secure_url,
                status: false
            };

            const newRequest = await this.model.createRequest(requestData);
            if (!newRequest) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create request'
                });
            }

            return res.status(201).json({
                success: true,
                request: newRequest,
                contentUrl: result.secure_url
            });
        } catch (error) {
            console.error('Upload and create request error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Get request by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    getRequestById = async (req, res) => {
        try {
            const { requestId } = req.params;

            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    error: 'Request ID is required'
                });
            }

            const request = await this.model.getRequestById(requestId);
            if (!request) {
                return res.status(404).json({
                    success: false,
                    error: 'Request not found'
                });
            }

            return res.status(200).json({
                success: true,
                request
            });
        } catch (error) {
            console.error('Get request error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Get all pending requests for the current user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    getPendingRequests = async (req, res) => {
        try {
            const userId = req.user.id;
            const { limit = null, offset = 0 } = req.query;

            const requests = await this.model.getPendingRequestsGroupedByUser(userId);
            if (!requests) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch pending requests'
                });
            }

            return res.status(200).json({
                success: true,
                requests,
                count: requests.length
            });
        } catch (error) {
            console.error('Get pending requests error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Get all approved requests for the current user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    getApprovedRequests = async (req, res) => {
        try {
            const userId = req.user.id;

            const requests = await this.model.getApprovedRequestsGroupedByUser(userId);
            if (!requests) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch approved requests'
                });
            }

            return res.status(200).json({
                success: true,
                requests,
                count: requests.length
            });
        } catch (error) {
            console.error('Get approved requests error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Update request status (approve/reject)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    updateRequestStatus = async (req, res) => {
        try {
            const { requestId } = req.params;
            const { status } = req.body;

            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    error: 'Request ID is required'
                });
            }

            if (status === undefined || typeof status !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    error: 'Valid status (boolean) is required'
                });
            }

            const updatedRequest = await this.model.updateRequest(requestId, { status });
            if (!updatedRequest) {
                return res.status(404).json({
                    success: false,
                    error: 'Request not found'
                });
            }

            return res.status(200).json({
                success: true,
                request: updatedRequest,
                message: status ? 'Request approved' : 'Request rejected'
            });
        } catch (error) {
            console.error('Update request error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };

    /**
     * Delete a request
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    deleteRequest = async (req, res) => {
        try {
            const { requestId } = req.params;

            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    error: 'Request ID is required'
                });
            }

            const deleted = await this.model.deleteRequest(requestId);
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'Request not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Request deleted successfully'
            });
        } catch (error) {
            console.error('Delete request error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
}

module.exports = RequestController;