const PetModel = require('../models/petModel.js');
const DB_Connection = require('../database/db');
const multer = require('multer');
// optional: if you already have this util, it will be used; else adjust accordingly
const { uploadPetAvatarBuffer } = require('../utils/cloudinary');
const { upsertDocs } = require('../rag/service.js');

const db = new DB_Connection();
const upload = multer({ storage: multer.memoryStorage() });

async function assertPetOwner(userId, petId) {
  const rs = await db.query_executor(`SELECT id FROM pets WHERE id = $1 AND owner_id = $2`, [petId, userId]);
  if (!rs?.rows?.length) {
    const err = new Error('Pet not found');
    err.status = 404;
    throw err;
  }
}

class PetController {
    constructor() {
        this.petModel = new PetModel();
    }

        // Returns an all-time medical record for a pet (print/share with vet)
        getPetMedicalRecord = async (req, res) => {
                try {
                        const petId = parseInt(req.params.petId, 10);
                        if (!petId) return res.status(400).json({ success: false, error: 'petId required' });

                        await assertPetOwner(req.user.id, petId);

                        const petRs = await db.query_executor(
                            `SELECT id, owner_id, name, species, breed, sex, birthdate, weight_kg, avatar_url, is_neutered, notes, created_at, updated_at
                             FROM pets WHERE id = $1 LIMIT 1`,
                            [petId]
                        );
                        const pet = petRs?.rows?.[0] || null;
                        if (!pet) return res.status(404).json({ success: false, error: 'Pet not found' });

                        const metricsRs = await db.query_executor(
                            `SELECT id, pet_id, measured_at, weight_kg, body_temp_c, heart_rate_bpm, respiration_rate_bpm,
                                            gum_color, body_condition_score, coat_skin, appetite_state, water_intake_state,
                                            urine_frequency, clump_size, stool_consistency, blood_in_stool, straining_to_pee, no_poop_48h, note
                             FROM pet_health_metrics
                             WHERE pet_id = $1
                             ORDER BY measured_at ASC`,
                            [petId]
                        );

                        const diseasesRs = await db.query_executor(
                            `SELECT pd.*, vc.name AS clinic_name, vc.phone AS clinic_phone, vc.address AS clinic_address
                             FROM pet_diseases pd
                             LEFT JOIN vet_clinics vc ON vc.id = pd.clinic_id
                             WHERE pd.pet_id = $1
                             ORDER BY COALESCE(pd.diagnosed_on, pd.created_at) ASC`,
                            [petId]
                        );

                        const vaccinationsRs = await db.query_executor(
                            `SELECT v.*, vc.name AS clinic_name, vc.phone AS clinic_phone, vc.address AS clinic_address,
                                            vt.name AS vet_name
                             FROM vaccinations v
                             LEFT JOIN vet_clinics vc ON vc.id = v.clinic_id
                             LEFT JOIN vets vt ON vt.user_id = v.vet_user_id
                             WHERE v.pet_id = $1
                             ORDER BY COALESCE(v.administered_on, v.due_on, v.created_at) ASC`,
                            [petId]
                        );

                        const dewormingsRs = await db.query_executor(
                            `SELECT *
                             FROM dewormings
                             WHERE pet_id = $1
                             ORDER BY COALESCE(administered_on, due_on, created_at) ASC`,
                            [petId]
                        );

                        const apptRs = await db.query_executor(
                            `SELECT a.*, vc.name AS clinic_name, vc.phone AS clinic_phone, vc.address AS clinic_address,
                                            vt.name AS vet_name
                             FROM appointments a
                             LEFT JOIN vet_clinics vc ON vc.id = a.clinic_id
                             LEFT JOIN vets vt ON vt.user_id = a.vet_user_id
                             WHERE a.pet_id = $1
                             ORDER BY COALESCE(a.starts_at, a.created_at) ASC`,
                            [petId]
                        );

                        return res.status(200).json({
                                success: true,
                                record: {
                                        pet,
                                        metrics: metricsRs?.rows || [],
                                        diseases: diseasesRs?.rows || [],
                                        vaccinations: vaccinationsRs?.rows || [],
                                        dewormings: dewormingsRs?.rows || [],
                                        appointments: apptRs?.rows || [],
                                }
                        });
                } catch (error) {
                        const status = error?.status || 500;
                        if (status !== 500) {
                            return res.status(status).json({ success: false, error: error.message || 'Request failed' });
                        }
                        console.error('GetPetMedicalRecord error:', error);
                        return res.status(500).json({ success: false, error: 'Internal server error' });
                }
        };

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
                        gum_color: r.health_gum_color,
                        body_condition_score: r.health_body_condition_score,
                        coat_skin: r.health_coat_skin,
                        appetite_state: r.health_appetite_state,
                        water_intake_state: r.health_water_intake_state,
                        urine_frequency: r.health_urine_frequency,
                        clump_size: r.health_clump_size,
                        stool_consistency: r.health_stool_consistency,
                        blood_in_stool: r.health_blood_in_stool,
                        straining_to_pee: r.health_straining_to_pee,
                        no_poop_48h: r.health_no_poop_48h,
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
                        clinic_id: r.disease_clinic_id,
                        notes: r.disease_notes
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
                    diseases: { active: activeDiseases, all: diseases },
                    vaccinations: { recent: recentVaccines, nextDue: nextVac, all: vaccinations },
                    dewormings: { recent: recentDeworm, nextDue: nextDew }
                }
            });
        } catch (e) {
            console.error('GetPetSummary (joined) error:', e);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    // Beshi kahini korte chaini tai r model call na kore eikhane kore dis
    // TODO: Model update korte hobe
    updatePet = async (req, res) => {
        try {
            const { petId } = req.params;
            await assertPetOwner(req.user.id, petId);
            const { name, species, breed, sex, birthdate, weight_kg, is_neutered, notes } = req.body;

            const q = `
              UPDATE pets SET
                name = COALESCE($1, name),
                species = COALESCE($2, species),
                breed = COALESCE($3, breed),
                sex = COALESCE($4, sex),
                birthdate = $5,
                weight_kg = $6,
                is_neutered = COALESCE($7, is_neutered),
                notes = $8,
                updated_at = NOW()
              WHERE id = $9
              RETURNING *;
            `;
            const result = await db.query_executor(q, [
              name ?? null,
              species ?? null,
              breed ?? null,
              sex ?? null,
              birthdate ?? null,
              weight_kg ?? null,
              typeof is_neutered === 'boolean' ? is_neutered : null,
              notes ?? null,
              petId,
            ]);
            const pet = result.rows?.[0] || null;
            if (pet) {
              await upsertDocs([{
                doc_id: `pet:${pet.id}:summary`,
                user_id: req.user.id,
                pet_id: pet.id,
                doc_type: 'pet_summary',
                content: `Pet ${pet.name} (${pet.species}), sex=${pet.sex}, breed=${pet.breed || 'unknown'}, birthdate=${pet.birthdate || 'unknown'}, weight=${pet.weight_kg ?? '—'}kg, neutered=${!!pet.is_neutered}. Notes: ${pet.notes || '—'}.`,
                metadata: { name: pet.name, species: pet.species }
              }]);
            }
            return res.json({ pet });
          } catch (e) {
            return res.status(e.status || 500).json({ error: e.message });
          }
    };

    addHealthMetric = async (req, res) => {
        try {
            const { petId } = req.params;
            await assertPetOwner(req.user.id, petId);
                        const {
                            measured_at, weight_kg, body_temp_c, heart_rate_bpm, respiration_rate_bpm,
                            gum_color, body_condition_score, coat_skin, appetite_state, water_intake_state,
                            urine_frequency, clump_size, stool_consistency, blood_in_stool, straining_to_pee, no_poop_48h, note
                        } = req.body;

                        const ins = await db.query_executor(
                            `INSERT INTO pet_health_metrics
                                 (pet_id, measured_at, weight_kg, body_temp_c, heart_rate_bpm, respiration_rate_bpm,
                                    gum_color, body_condition_score, coat_skin, appetite_state, water_intake_state,
                                    urine_frequency, clump_size, stool_consistency, blood_in_stool, straining_to_pee, no_poop_48h, note)
                             VALUES ($1, COALESCE($2, NOW()), $3, $4, $5, $6,
                                             $7, $8, $9, $10, $11,
                                             $12, $13, $14, $15, $16, $17, $18)
                             RETURNING *`,
                            [
                                petId,
                                measured_at ?? null,
                                weight_kg ?? null,
                                body_temp_c ?? null,
                                heart_rate_bpm ?? null,
                                respiration_rate_bpm ?? null,
                                gum_color ?? null,
                                body_condition_score ?? null,
                                coat_skin ?? null,
                                appetite_state ?? null,
                                water_intake_state ?? null,
                                urine_frequency ?? null,
                                clump_size ?? null,
                                stool_consistency ?? null,
                                typeof blood_in_stool === 'boolean' ? blood_in_stool : null,
                                typeof straining_to_pee === 'boolean' ? straining_to_pee : null,
                                typeof no_poop_48h === 'boolean' ? no_poop_48h : null,
                                note ?? null
                            ]
                        );

            if (typeof weight_kg === 'number') {
              await db.query_executor(`UPDATE pets SET weight_kg = $1, updated_at = NOW() WHERE id = $2`, [weight_kg, petId]);
            }

            const metric = ins.rows?.[0] || null;
            if (metric) {
              await upsertDocs([{
                doc_id: `pet:${metric.pet_id}:metric:${metric.id}`,
                user_id: req.user.id,
                pet_id: Number(metric.pet_id),
                doc_type: 'metric',
                content: `Metric at ${metric.measured_at}: weight=${metric.weight_kg ?? '—'}kg, temp=${metric.body_temp_c ?? '—'}C, HR=${metric.heart_rate_bpm ?? '—'}bpm, RR=${metric.respiration_rate_bpm ?? '—'}bpm, gums=${metric.gum_color || '—'}, BCS=${metric.body_condition_score || '—'}, coat=${metric.coat_skin || '—'}, appetite=${metric.appetite_state || '—'}, water=${metric.water_intake_state || '—'}, urine_freq=${metric.urine_frequency || '—'}, clump=${metric.clump_size || '—'}, stool=${metric.stool_consistency || '—'}, blood_stool=${metric.blood_in_stool ?? '—'}, straining=${metric.straining_to_pee ?? '—'}, no_poop_48h=${metric.no_poop_48h ?? '—'}. Note: ${metric.note || '—'}.`,
                metadata: { measured_at: metric.measured_at }
              }]);
            }
            return res.status(201).json({ metric });
          } catch (e) {
            return res.status(e.status || 500).json({ error: e.message });
          }
    };

    uploadMiddleware = upload.single('avatar');

    uploadPetAvatar = async (req, res) => {
        try {
            const { petId } = req.params;
            await assertPetOwner(req.user.id, petId);
            if (!req.file?.buffer) return res.status(400).json({ error: 'No file uploaded' });

            const uploaded = await uploadPetAvatarBuffer(req.file.buffer, `pets/${petId}`);
            const url = uploaded?.secure_url || uploaded?.url;
            if (!url) throw new Error('Upload failed');

            const rs = await db.query_executor(
              `UPDATE pets SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
              [url, petId]
            );
            return res.json({ pet: rs.rows?.[0] || null });
          } catch (e) {
            return res.status(e.status || 500).json({ error: e.message });
          }
    };
}

module.exports = PetController;