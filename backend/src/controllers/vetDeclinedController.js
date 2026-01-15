const VetDeclinedModel = require('../models/vetDeclinedModel.js');
const RequestModel = require('../models/requestModel.js');
const VetApprovedModel = require('../models/vetApprovedModel.js');

class VetDeclinedController {
    constructor() {
        this.vetDeclinedModel = new VetDeclinedModel();
        this.requestModel = new RequestModel();
        this.vetApprovedModel = new VetApprovedModel();
    }

    declineRequest = async (req, res) => {
        try {
            const vetId = req.user.id;
            const { requestId } = req.params;
            const { correct_diagnosis, note } = req.body || {};

            if (!requestId) {
                return res.status(400).json({ success: false, error: 'Request ID is required' });
            }

            const request = await this.requestModel.getRequestById(requestId);
            if (!request) {
                return res.status(404).json({ success: false, error: 'Request not found' });
            }

            const isApproved = await this.vetApprovedModel.isRequestApproved(requestId);
            if (isApproved) {
                return res.status(409).json({ success: false, error: 'Request is already approved by a vet' });
            }

            const isDeclined = await this.vetDeclinedModel.isRequestDeclined(requestId);
            if (isDeclined) {
                return res.status(409).json({ success: false, error: 'Request is already declined by a vet' });
            }

            const decline = await this.vetDeclinedModel.declineRequest({
                vet_id: vetId,
                req_id: requestId,
                correct_diagnosis: correct_diagnosis || null,
                note: note || null,
            });

            return res.status(201).json({
                success: true,
                message: 'Request declined successfully',
                decline,
            });
        } catch (error) {
            console.error('Decline request error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    getMyDeclines = async (req, res) => {
        try {
            const vetId = req.user.id;
            const limit = req.query.limit != null ? Number(req.query.limit) : 25;
            const declines = await this.vetDeclinedModel.getDeclinesByVet(vetId, limit);
            return res.status(200).json({ success: true, declines, count: declines.length });
        } catch (error) {
            console.error('Get my declines error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
}

module.exports = VetDeclinedController;
