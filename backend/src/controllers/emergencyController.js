const EmergencyModel = require('../models/emergencyModel.js');

class EmergencyController {
    constructor() {
        this.model = new EmergencyModel();
    }

    addEmergencyRequest = async (req, res) => {
        try {
            const requester_user_id = req.user.id; // from auth middleware
            const {
                pet_id, clinic_id, description,
                location_lat, location_lng, meta
            } = req.body;

            if (!pet_id || !description) {
                return res.status(400).json({ success: false, error: 'pet_id and description required' });
            }

            const emergency = await this.model.createEmergencyRequest({
                pet_id,
                requester_user_id,
                clinic_id,
                description,
                status: 'open',
                location_lat,
                location_lng,
                meta
            });

            if (!emergency || emergency.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to create emergency request' });
            }

            return res.status(201).json({ success: true, emergency });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    getMyEmergencyRequests = async (req, res) => {
        try {
            const requester_user_id = req.user.id;
            const requests = await this.model.getRequestsByUser(requester_user_id);
            return res.status(200).json({ success: true, requests });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
}

module.exports = EmergencyController;