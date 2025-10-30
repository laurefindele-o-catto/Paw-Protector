const CareModel = require('../models/careModel.js');

class CareController {
    constructor() {
        this.careModel = new CareModel();
    }

    addVaccination = async (req, res) => {
        try {
            const data = req.body;
            if (!data.pet_id || !data.vaccine_name) {
                return res.status(400).json({ success: false, error: 'pet_id and vaccine_name required' });
            }
            const result = await this.careModel.addVaccination(data);
            if (!result || result.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to add vaccination' });
            }
            return res.status(201).json({ success: true, vaccination: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    addDeworming = async (req, res) => {
        try {
            const data = req.body;
            if (!data.pet_id || !data.product_name) {
                return res.status(400).json({ success: false, error: 'pet_id and product_name required' });
            }
            const result = await this.careModel.addDeworming(data);
            if (!result || result.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to add deworming' });
            }
            return res.status(201).json({ success: true, deworming: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    addReminder = async (req, res) => {
        try {
            const data = req.body;
            if (!data.user_id || !data.pet_id || !data.type || !data.title || !data.start_at) {
                return res.status(400).json({ success: false, error: 'Missing required fields' });
            }
            const result = await this.careModel.addReminder(data);
            if (!result || result.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to add reminder' });
            }
            return res.status(201).json({ success: true, reminder: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
c
    addNotification = async (req, res) => {
        try {
            const data = req.body;
            if (!data.user_id || !data.title) {
                return res.status(400).json({ success: false, error: 'user_id and title required' });
            }
            const result = await this.careModel.addNotification(data);
            if (!result || result.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to add notification' });
            }
            return res.status(201).json({ success: true, notification: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
}

module.exports = CareController;