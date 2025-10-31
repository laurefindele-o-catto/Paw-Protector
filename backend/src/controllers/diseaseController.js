const DiseaseModel = require('../models/diseaseModel.js');

class DiseaseController {
    constructor() {
        this.diseaseModel = new DiseaseModel();
    }

    // Creates a disease record for a pet
    addDisease = async (req, res) => {
        try {
            const { petId } = req.params;
            const data = { ...req.body, pet_id: parseInt(petId) };
            if (!data.pet_id || !data.disease_name) {
                return res.status(400).json({ success: false, error: 'pet_id and disease_name required' });
            }
            const result = await this.diseaseModel.addDisease(data);
            if (!result || result.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to add disease' });
            }
            return res.status(201).json({ success: true, disease: result });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Lists diseases for a pet
    listForPet = async (req, res) => {
        try {
            const { petId } = req.params;
            const rows = await this.diseaseModel.getByPetId(parseInt(petId));
            return res.status(200).json({ success: true, diseases: rows });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Lists active diseases for a pet
    listActiveForPet = async (req, res) => {
        try {
            const { petId } = req.params;
            const rows = await this.diseaseModel.getActiveByPetId(parseInt(petId));
            return res.status(200).json({ success: true, diseases: rows });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Gets a disease record by id
    getOne = async (req, res) => {
        try {
            const { id } = req.params;
            const row = await this.diseaseModel.getById(parseInt(id));
            if (!row) return res.status(404).json({ success: false, error: 'Not found' });
            return res.status(200).json({ success: true, disease: row });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Updates a disease record
    updateOne = async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await this.diseaseModel.updateDisease(parseInt(id), req.body || {});
            if (!updated || updated.success === false) {
                return res.status(400).json({ success: false, error: 'Update failed' });
            }
            return res.status(200).json({ success: true, disease: updated });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Deletes a disease record
    deleteOne = async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await this.diseaseModel.deleteDisease(parseInt(id));
            if (!deleted || deleted.success === false) {
                return res.status(400).json({ success: false, error: 'Delete failed' });
            }
            return res.status(200).json({ success: true, id: deleted.id });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}

module.exports = DiseaseController;