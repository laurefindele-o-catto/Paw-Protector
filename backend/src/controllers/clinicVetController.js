const ClinicVetModel = require('../models/clinicVetModel.js');
const VerificationMailer = require("../utils/verificationMailer.js");


class ClinicVetController {
    constructor() {
        this.model = new ClinicVetModel();
        this.mailer = new VerificationMailer();
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

            try {
                await this.mailer.sendVetVerificationRequest(result);
            } catch (mailErr) {
                console.error("Failed to send verification email:", mailErr.message);
                // still return success for vet creation
            }


            return res.status(201).json({ success: true, vet: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    updateVet = async (req, res) => {
        try {
            const data = req.body;
            const id = req.params.user_id;
            if (!id) return res.status(400).json({ success: false, error: 'user_id required' });

            // If no clinic_id is supplied, create/find a default "Home Practice" clinic using provided location.
            let clinic_id = data.clinic_id;
            if (!clinic_id) {
                try {
                    const defaultClinic = await this.model.createClinic({
                        name: 'Home Practice',
                        phone: data.phone || null,
                        email: data.email || null,
                        address: data.address || 'Home visit practice',
                        latitude: data.latitude ?? null,
                        longitude: data.longitude ?? null,
                        hours: null,
                        is_verified: false
                    });
                    if (defaultClinic && !defaultClinic.success) throw new Error('Failed to create default clinic');
                    clinic_id = defaultClinic?.id || null;
                } catch (e) {
                    // If clinic creation fails, allow null clinic_id (DB must permit NULL)
                    clinic_id = clinic_id ?? null;
                }
            }

            const result = await this.model.updateVet(id, { ...data, clinic_id });
            if (!result || result.success === false) return res.status(500).json({ success: false, error: 'Failed to update vet' });
            // if vet is still unverified, send email again
            if (!result.verified) {
                try {
                    await this.mailer.sendVetVerificationRequest(result);
                } catch (mailErr) {
                    console.error("Failed to send verification email:", mailErr.message);
                }
            }

            return res.status(200).json({ success: true, vet: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    getVet = async (req, res) => {
        try {
            const id = req.params.user_id;
            if (!id) return res.status(400).json({ success: false, error: 'user_id required' });

            const result = await this.model.getVet(id);
            if (!result) return res.status(404).json({ success: false, error: 'Vet not found' });

            return res.status(200).json({ success: true, vet: result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

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