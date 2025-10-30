const ClinicVetModel = require('../models/clinicVetModel.js');

class ClinicVetController {
    constructor() {
        this.model = new ClinicVetModel();
    }

    addClinic = async (req, res) => {
        try {
            const data = req.body;
            if (!data.name) return res.status(400).json({ success: false, error: 'Clinic name required' });
            const result = await this.model.createClinic(data);
            if (!result || result.success === false) return res.status(500).json({ success: false, error: 'Failed to add clinic' });
            return res.status(201).json({ success: true, clinic: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    addVet = async (req, res) => {
        try {
            const data = req.body;
            if (!data.user_id || !data.name) return res.status(400).json({ success: false, error: 'user_id and name required' });
            const result = await this.model.createVet(data);
            if (!result || result.success === false) return res.status(500).json({ success: false, error: 'Failed to add vet' });
            return res.status(201).json({ success: true, vet: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    addReview = async (req, res) => {
        try {
            const data = req.body;
            if (!data.reviewer_user_id || !data.vet_user_id || !data.rating) {
                return res.status(400).json({ success: false, error: 'reviewer_user_id, vet_user_id, rating required' });
            }
            const result = await this.model.createReview(data);
            if (!result || result.success === false) return res.status(500).json({ success: false, error: 'Failed to add review' });
            return res.status(201).json({ success: true, review: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    addAppointment = async (req, res) => {
        try {
            const data = req.body;
            if (!data.pet_id || !data.owner_user_id || !data.vet_user_id || !data.starts_at || !data.status) {
                return res.status(400).json({ success: false, error: 'Missing required fields' });
            }
            const result = await this.model.createAppointment(data);
            if (!result || result.success === false) return res.status(500).json({ success: false, error: 'Failed to add appointment' });
            return res.status(201).json({ success: true, appointment: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
}

module.exports = ClinicVetController;