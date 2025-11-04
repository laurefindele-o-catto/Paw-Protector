const DB_Connection = require('../database/db');
const DiseaseModel = require('../models/diseaseModel');
const db = new DB_Connection();
const diseaseModel = new DiseaseModel();

async function assertPetOwner(userId, petId) {
  const rs = await db.query_executor(`SELECT id FROM pets WHERE id = $1 AND owner_id = $2`, [petId, userId]);
  if (!rs?.rows?.length) {
    const err = new Error('Pet not found');
    err.status = 404;
    throw err;
  }
}

async function assertDiseaseOwner(userId, diseaseId) {
  const q = `
    SELECT d.id FROM pet_diseases d
    JOIN pets p ON p.id = d.pet_id
    WHERE d.id = $1 AND p.owner_id = $2
  `;
  const rs = await db.query_executor(q, [diseaseId, userId]);
  if (!rs?.rows?.length) {
    const err = new Error('Disease not found');
    err.status = 404;
    throw err;
  }
}

class DiseaseController {
    constructor() {
        this.diseaseModel = new DiseaseModel();
    }

    // Creates a disease record for a pet
    addDisease = async (req, res) => {
        try {
            const { petId } = req.params;
            await assertPetOwner(req.user.id, parseInt(petId, 10)); // guard
            const data = { ...req.body, pet_id: parseInt(petId, 10) };
            if (!data.pet_id || !data.disease_name) {
                return res.status(400).json({ success: false, error: 'pet_id and disease_name required' });
            }
            const result = await this.diseaseModel.addDisease(data);
            if (!result || result.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to add disease' });
            }
            return res.status(201).json({ success: true, disease: result });
        } catch (e) {
            return res.status(e.status || 500).json({ success: false, error: e.message || 'Internal server error' });
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
            await assertDiseaseOwner(req.user.id, parseInt(id, 10)); // guard
            const updated = await this.diseaseModel.updateDisease(parseInt(id, 10), req.body || {});
            if (!updated || updated.success === false) {
                return res.status(400).json({ success: false, error: 'Update failed' });
            }
            return res.status(200).json({ success: true, disease: updated });
        } catch (e) {
            return res.status(e.status || 500).json({ success: false, error: e.message || 'Internal server error' });
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