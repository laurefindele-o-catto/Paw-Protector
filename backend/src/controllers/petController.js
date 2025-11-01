const PetModel = require('../models/petModel.js');
const { uploadPetAvatarBuffer } = require('../utils/cloudinary.js');

class PetController {
    constructor() {
        this.petModel = new PetModel();
    }

    // Creates a pet
    addPet = async (req, res) => {
        try {
            const owner_id = req.user.id; 
            const { name, species, breed, sex, birthdate, weight_kg, avatar_url, is_neutered, notes } = req.body;
            if (!name || !species) return res.status(400).json({ success: false, error: 'Name and species are required' });

            const pet = await this.petModel.createPet({ owner_id, name, species, breed, sex, birthdate, weight_kg, avatar_url, is_neutered, notes });
            if (!pet || pet.success === false) return res.status(500).json({ success: false, error: 'Failed to add pet' });

            return res.status(201).json({ success: true, pet });
        } catch (error) {
            console.error('Add pet error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    // Lists my pets
    getMyPets = async (req, res) => {
        try {
            const owner_id = req.user.id;
            const pets = await this.petModel.getPetsByOwner(owner_id);
            return res.status(200).json({ success: true, pets });
        } catch (error) {
            console.error('Get pets error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    // Uploads a pet avatar to Cloudinary and stores the url
    uploadAvatar = async (req, res) => {
        try {
            const { petId } = req.params;
            const file = req.file;
            const id = parseInt(petId, 10);

            if (!id) return res.status(400).json({ success: false, error: 'Valid pet id required' });
            if (!file) return res.status(400).json({ success: false, error: 'Avatar file is required' });
            if (!/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) return res.status(400).json({ success: false, error: 'Unsupported image type' });

            const pet = await this.petModel.getPetById(id);
            if (!pet || pet.owner_id !== req.user.id) return res.status(404).json({ success: false, error: 'Pet not found' });

            const result = await uploadPetAvatarBuffer(file.buffer, id);
            const updatedPet = await this.petModel.updatePetAvatar(id, result.secure_url);
            if (!updatedPet) return res.status(500).json({ success: false, error: 'Failed to update pet with avatar url' });

            return res.status(200).json({ success: true, pet: updatedPet });
        } catch (error) {
            console.error('Upload pet avatar error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    // Returns a summarized snapshot for a pet using a single JOIN fetch
    getPetSummary = async (req, res) => {
        try {
            const petId = parseInt(req.params.petId, 10);
            if (!petId) return res.status(400).json({ success: false, error: 'petId required' });

            // Single round-trip
            const rows = await this.petModel.getSummaryJoined(petId);
            if (!rows || rows.length === 0) return res.status(404).json({ success: false, error: 'Pet not found' });

            // Owner guard using joined row
            const ownerId = rows[0].pet_owner_id;
            if (ownerId !== req.user.id) return res.status(404).json({ success: false, error: 'Pet not found' });

            // Build pet
            const pet = {
                id: rows[0].pet_id,
                owner_id: rows[0].pet_owner_id,
                name: rows[0].pet_name,
                species: rows[0].pet_species,
                breed: rows[0].pet_breed,
                sex: rows[0].pet_sex,
                birthdate: rows[0].pet_birthdate,
                weight_kg: rows[0].pet_weight_kg,
                avatar_url: rows[0].pet_avatar_url,
                is_neutered: rows[0].pet_is_neutered,
                notes: rows[0].pet_notes,
                created_at: rows[0].pet_created_at,
                updated_at: rows[0].pet_updated_at
            };

            // Deduplicate/aggregate child records from cartesian rows
            const metricMap = new Map();
            const diseaseMap = new Map();
            const vaccineMap = new Map();
            const dewormMap = new Map();

            for (const r of rows) {
                if (r.health_metric_id && !metricMap.has(r.health_metric_id)) {
                    metricMap.set(r.health_metric_id, {
                        id: r.health_metric_id,
                        measured_at: r.health_measured_at,
                        weight_kg: r.health_weight_kg || r.pet_weight_kg,
                        body_temp_c: r.health_body_temp_c,
                        heart_rate_bpm: r.health_heart_rate_bpm,
                        respiration_rate_bpm: r.health_respiration_rate_bpm,
                        note: r.health_note
                    });
                }
                if (r.disease_id && !diseaseMap.has(r.disease_id)) {
                    diseaseMap.set(r.disease_id, {
                        id: r.disease_id,
                        disease_name: r.disease_name,
                        symptoms: r.disease_symptoms,
                        severity: r.disease_severity,
                        status: r.disease_status,
                        diagnosed_on: r.disease_diagnosed_on,
                        resolved_on: r.disease_resolved_on,
                        vet_user_id: r.disease_vet_user_id,
                        clinic_id: r.disease_clinic_id
                    });
                }
                if (r.vaccine_id && !vaccineMap.has(r.vaccine_id)) {
                    vaccineMap.set(r.vaccine_id, {
                        id: r.vaccine_id,
                        vaccine_name: r.vaccine_name,
                        dose_number: r.vaccine_dose_number,
                        administered_on: r.vaccine_administered_on,
                        due_on: r.vaccine_due_on,
                        clinic_id: r.vaccine_clinic_id,
                        vet_user_id: r.vaccine_vet_user_id,
                        certificate_url: r.vaccine_certificate_url,
                        notes: r.vaccine_notes
                    });
                }
                if (r.deworm_id && !dewormMap.has(r.deworm_id)) {
                    dewormMap.set(r.deworm_id, {
                        id: r.deworm_id,
                        product_name: r.deworm_product_name,
                        administered_on: r.deworm_administered_on,
                        due_on: r.deworm_due_on,
                        weight_based_dose: r.deworm_weight_based_dose,
                        notes: r.deworm_notes,
                        created_at: r.deworm_created_at
                    });
                }
            }

            const metrics = Array.from(metricMap.values())
                .sort((a, b) => new Date(b.measured_at || 0) - new Date(a.measured_at || 0));
            const diseases = Array.from(diseaseMap.values())
                .sort((a, b) => new Date(b.diagnosed_on || 0) - new Date(a.diagnosed_on || 0));
            const vaccinations = Array.from(vaccineMap.values())
                .sort((a, b) => new Date(b.administered_on || 0) - new Date(a.administered_on || 0));
            const dewormings = Array.from(dewormMap.values())
                .sort((a, b) => new Date(b.administered_on || 0) - new Date(a.administered_on || 0));

            // Compute latests and next dues (keep same frontend shape)
            let latestWeight = (metrics.find(m => m.weight_kg != null) || {}).weight_kg ?? null;
            let latestTemp = (metrics.find(m => m.body_temp_c != null) || {}).body_temp_c ?? null;
            // Fallback: if no recent metric, use stored pet weight
            if (latestWeight == null && pet.weight_kg != null) {
                latestWeight = pet.weight_kg;
            }

            const today = new Date(new Date().toDateString());
            const nextVac = vaccinations
                .filter(v => v.due_on)
                .filter(v => new Date(v.due_on) >= today)
                .sort((a, b) => new Date(a.due_on) - new Date(b.due_on))[0] || null;

            const nextDew = dewormings
                .filter(d => d.due_on)
                .filter(d => new Date(d.due_on) >= today)
                .sort((a, b) => new Date(a.due_on) - new Date(b.due_on))[0] || null;

            // Limit lists to keep UI snappy (same as before)
            const trend = metrics.slice(0, 7);
            const recentVaccines = vaccinations.slice(0, 5);
            const recentDeworm = dewormings.slice(0, 3);
            const activeDiseases = diseases.filter(d => d.status === 'active');

            return res.status(200).json({
                success: true,
                summary: {
                    pet,
                    metrics: { latestWeightKg: latestWeight, latestTempC: latestTemp, trend },
                    diseases: { active: activeDiseases },
                    vaccinations: { recent: recentVaccines, nextDue: nextVac },
                    dewormings: { recent: recentDeworm, nextDue: nextDew }
                }
            });
        } catch (e) {
            console.error('GetPetSummary (joined) error:', e);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
}

module.exports = PetController;