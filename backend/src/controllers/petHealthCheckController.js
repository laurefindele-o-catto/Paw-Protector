const multer = require('multer');
const PetHealthCheckModel = require('../models/petHealthCheckModel.js');
const { uploadRequestContentBuffer } = require('../utils/cloudinary.js');

const upload = multer({ storage: multer.memoryStorage() });

class PetHealthCheckController {
    constructor() {
        this.model = new PetHealthCheckModel();
        this.uploadMiddleware = upload.array('files', 5);
    }

    uploadImages = async (req, res) => {
        try {
            const userId = req.user.id;
            const files = req.files || [];
            if (!files.length) {
                return res.status(400).json({ success: false, error: 'No files uploaded' });
            }

            for (const f of files) {
                if (!/^image\/(png|jpe?g|webp)$/i.test(f.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Unsupported file type. Only images (PNG, JPEG, WebP) are allowed',
                    });
                }
            }

            const uploads = await Promise.all(
                files.map((f) => uploadRequestContentBuffer(f.buffer, userId))
            );

            const urls = uploads
                .filter((u) => u && u.secure_url)
                .map((u) => u.secure_url);

            return res.status(200).json({ success: true, urls });
        } catch (error) {
            console.error('health check uploadImages error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    create = async (req, res) => {
        try {
            const ownerUserId = req.user.id;
            const { vet_user_id, pet_id, problem_text, image_urls, health_profile } = req.body || {};

            const vetIdNum = Number(vet_user_id);
            const petIdNum = pet_id != null && `${pet_id}`.trim() !== '' ? Number(pet_id) : null;

            if (!Number.isFinite(vetIdNum)) {
                return res.status(400).json({ success: false, error: 'vet_user_id must be a valid number' });
            }
            if (!problem_text || !String(problem_text).trim()) {
                return res.status(400).json({ success: false, error: 'problem_text is required' });
            }
            if (petIdNum !== null && !Number.isFinite(petIdNum)) {
                return res.status(400).json({ success: false, error: 'pet_id must be a valid number' });
            }

            const created = await this.model.createRequest({
                owner_user_id: ownerUserId,
                vet_user_id: vetIdNum,
                pet_id: petIdNum,
                problem_text: String(problem_text),
                image_urls: Array.isArray(image_urls) ? image_urls : [],
                health_profile: health_profile ?? null,
            });

            return res.status(201).json({ success: true, request: created });
        } catch (error) {
            console.error('health check create error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    listMine = async (req, res) => {
        try {
            const ownerUserId = req.user.id;
            const limit = req.query.limit != null ? Number(req.query.limit) : 25;
            const items = await this.model.listMine(ownerUserId, limit);
            return res.status(200).json({ success: true, requests: items, count: items.length });
        } catch (error) {
            console.error('health check listMine error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    getById = async (req, res) => {
        try {
            const userId = req.user.id;
            const id = Number(req.params.id);
            if (!Number.isFinite(id)) {
                return res.status(400).json({ success: false, error: 'id must be a valid number' });
            }

            const item = await this.model.getById(id);
            if (!item) {
                return res.status(404).json({ success: false, error: 'Request not found' });
            }

            const isOwner = Number(item.owner_user_id) === Number(userId);
            const isVet = Number(item.vet_user_id) === Number(userId);
            if (!isOwner && !isVet) {
                return res.status(403).json({ success: false, error: 'Forbidden' });
            }

            return res.status(200).json({ success: true, request: item });
        } catch (error) {
            console.error('health check getById error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    listVetPending = async (req, res) => {
        try {
            const vetUserId = req.user.id;
            const limit = req.query.limit != null ? Number(req.query.limit) : 25;
            const items = await this.model.listForVet(vetUserId, 'pending', limit);
            return res.status(200).json({ success: true, requests: items, count: items.length });
        } catch (error) {
            console.error('health check listVetPending error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    listVetAll = async (req, res) => {
        try {
            const vetUserId = req.user.id;
            const limit = req.query.limit != null ? Number(req.query.limit) : 25;
            const status = req.query.status != null ? String(req.query.status) : null;
            const items = await this.model.listForVet(vetUserId, status, limit);
            return res.status(200).json({ success: true, requests: items, count: items.length });
        } catch (error) {
            console.error('health check listVetAll error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    respond = async (req, res) => {
        try {
            const vetUserId = req.user.id;
            const id = Number(req.params.id);
            const { vet_response } = req.body || {};

            if (!Number.isFinite(id)) {
                return res.status(400).json({ success: false, error: 'id must be a valid number' });
            }
            if (!vet_response || !String(vet_response).trim()) {
                return res.status(400).json({ success: false, error: 'vet_response is required' });
            }

            const updated = await this.model.respond({
                id,
                vet_user_id: vetUserId,
                vet_response: String(vet_response),
            });

            if (!updated) {
                return res.status(404).json({ success: false, error: 'Request not found (or not assigned to this vet)' });
            }

            return res.status(200).json({ success: true, request: updated });
        } catch (error) {
            console.error('health check respond error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    vetSummary = async (req, res) => {
        try {
            const vetUserId = req.user.id;
            const limit = req.query.limit != null ? Number(req.query.limit) : 50;
            const summary = await this.model.getVetPetSummary(vetUserId, limit);
            const counts = await this.model.countForVet(vetUserId);
            return res.status(200).json({ success: true, summary, counts });
        } catch (error) {
            console.error('health check vetSummary error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
}

module.exports = PetHealthCheckController;
