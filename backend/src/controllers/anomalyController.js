const AnomalyModel = require('../models/anomalyModel.js');
const { v2: cloudinary } = require('cloudinary');

class AnomalyController {
    constructor() {
        this.model = new AnomalyModel();
    }

    // Upload image to Cloudinary and store info
    uploadMedia = async (req, res) => {
        try {
            const owner_user_id = req.user.id;
            const { pet_id, taken_at, meta } = req.body;
            if (!req.file || !pet_id) {
                return res.status(400).json({ success: false, error: 'Image file and pet_id required' });
            }

            // Upload to Cloudinary
            cloudinary.uploader.upload_stream(
                {
                    folder: 'pet_images',
                    resource_type: 'image',
                    public_id: `pet_${pet_id}_${Date.now()}`,
                    overwrite: true,
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                },
                async (err, result) => {
                    if (err) {
                        return res.status(500).json({ success: false, error: 'Cloudinary upload failed' });
                    }
                    // Store in DB
                    const asset = await this.model.addMediaAsset({
                        owner_user_id,
                        pet_id,
                        url: result.secure_url,
                        content_type: req.file.mimetype,
                        width: result.width,
                        height: result.height,
                        taken_at,
                        meta
                    });
                    if (!asset || asset.success === false) {
                        return res.status(500).json({ success: false, error: 'Failed to store media asset' });
                    }
                    return res.status(201).json({ success: true, asset });
                }
            ).end(req.file.buffer);
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    // Create anomaly job
    createAnomalyJob = async (req, res) => {
        try {
            const requester_user_id = req.user.id;
            const { pet_id, media_id, model_name } = req.body;
            if (!pet_id || !media_id || !model_name) {
                return res.status(400).json({ success: false, error: 'pet_id, media_id, model_name required' });
            }
            const job = await this.model.addAnomalyJob({
                requester_user_id,
                pet_id,
                media_id,
                status: 'queued',
                model_name
            });
            if (!job || job.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to create anomaly job' });
            }
            return res.status(201).json({ success: true, job });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    // Store anomaly result
    addAnomalyResult = async (req, res) => {
        try {
            const { job_id, label, confidence, bbox, advice } = req.body;
            if (!job_id || !label || confidence === undefined) {
                return res.status(400).json({ success: false, error: 'job_id, label, confidence required' });
            }
            const result = await this.model.addAnomalyResult({
                job_id,
                label,
                confidence,
                bbox,
                advice
            });
            if (!result || result.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to store anomaly result' });
            }
            return res.status(201).json({ success: true, result });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
}

module.exports = AnomalyController;