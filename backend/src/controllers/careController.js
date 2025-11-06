const CareModel = require('../models/careModel.js');
const DB_Connection = require('../database/db.js');
const { upsertDocs } = require('../rag/service.js');
const { getCareAgent } = require('../rag/agentGraph.js');
const db = new DB_Connection();

function startOfWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

async function assertPetOwner(userId, petId) {
    const rs = await db.query_executor(`SELECT id FROM pets WHERE id = $1 AND owner_id = $2`, [petId, userId]);
    if (!rs?.rows?.length) {
        const err = new Error('Pet not found');
        err.status = 404;
        throw err;
    }
}

class CareController {
    constructor() {
        this.careModel = new CareModel();
    }

    generatePlan = async (req, res) => {
        try {
        const userId = req.user?.id;
        const { pet_id, force } = req.body || {};
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        if (!pet_id) return res.status(400).json({ success: false, error: 'pet_id required' });
        // Ensure the pet belongs to the user
        await assertPetOwner(userId, Number(pet_id));

        // Freshness guardrail (server-side)
        const lastUpdated = await this.careModel.getLastMetricUpdatedAt(Number(pet_id));
        const now = new Date();
        const fresh = lastUpdated ? (now - new Date(lastUpdated)) <= (7 * 24 * 60 * 60 * 1000) : false;
        if (!fresh && !force) {
            return res.status(412).json({
            success: false,
            code: 'METRICS_OUTDATED',
            message_bn: 'গত ৭ দিনের মধ্যে health metrics আপডেট নেই। আপডেট না করা পর্যন্ত কার্ড তৈরি করা যাবে না।'
            });
        }

        const week_start = startOfWeek(now);
        const agent = getCareAgent();
        const configurable = {
            thread_id: `care-${userId}-${pet_id}-${week_start}`,
            user_id: userId,
            pet_id: Number(pet_id),
            doc_types: 'metric,disease,vaccination,deworming,vision,chat,care_plan,care_summary',
            topK: 8
        };

        const ask = `
            Create weekly care JSON for pet_id=${pet_id}.
            Week start=${week_start}. Obey the output schema strictly.
        `;
        const result = await agent.invoke(
            { messages: [{ role: 'user', content: ask }] },
            { configurable }
        );
        const raw = String(result?.messages?.at?.(-1)?.content || '').trim();
        let parsed;
        try { parsed = JSON.parse(raw); } catch { 
            return res.status(500).json({ success: false, error: 'Agent did not return valid JSON' });
        }
        if (!parsed?.allow) {
            return res.status(412).json({
            success: false,
            code: 'METRICS_OUTDATED_OR_BLOCKED',
            message_bn: parsed?.reason_bn || 'এই সপ্তাহে কার্ড তৈরি অনুমোদিত নয়।'
            });
        }

        const saved = await this.careModel.upsertCarePlan({
            pet_id: Number(pet_id),
            week_start,
            summary_json: parsed.summary,
            plan_json: parsed.plan,
            sources: null
        });

        // Upsert to RAG (so chat can reference)
        try {
            await upsertDocs([
            {
                doc_id: `care_summary:${pet_id}:${week_start}`,
                user_id: userId,
                pet_id: Number(pet_id),
                doc_type: 'care_summary',
                content: `${parsed.summary?.current_status_bn || ''} ${parsed.summary?.trend_bn || ''}`.trim(),
                metadata: { week_start }
            },
            {
                doc_id: `care_plan:${pet_id}:${week_start}`,
                user_id: userId,
                pet_id: Number(pet_id),
                doc_type: 'care_plan',
                content: JSON.stringify(parsed.plan),
                metadata: { week_start }
            }
            ]);
        } catch {}

        return res.status(201).json({
            success: true,
            week_start,
            summary: parsed.summary,
            plan: parsed.plan,
            saved_id: saved?.id || null
        });
        } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
        }
    };

    getPlan = async (req, res) => {
        try {
        const userId = req.user?.id;
        const { pet_id, week } = req.query || {};
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        if (!pet_id) return res.status(400).json({ success: false, error: 'pet_id required' });
        await assertPetOwner(userId, Number(pet_id));
        const week_start = week || startOfWeek(new Date());
        const row = await this.careModel.getCarePlan({ pet_id: Number(pet_id), week_start });
        if (!row) return res.status(404).json({ success: false, error: 'No plan found' });
        return res.json({ success: true, week_start, summary: row.summary_json, plan: row.plan_json });
        } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
        }
    };

    getSummary = async (req, res) => {
        try {
        const userId = req.user?.id;
        // Support both /care/summary?pet_id= and /care/summary/:pet_id
        const pet_id = req.params?.pet_id ?? req.query?.pet_id;
         if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        if (!pet_id) return res.status(400).json({ success: false, error: 'pet_id required' });
        await assertPetOwner(userId, Number(pet_id));
         const latest = await this.careModel.getLatestCarePlan(Number(pet_id));
         if (!latest) return res.status(404).json({ success: false, error: 'No summary found' });
         return res.json({ success: true, week_start: latest.week_start, summary: latest.summary_json });
        } catch (e) {
         return res.status(500).json({ success: false, error: e.message });
        }
    };

    // Vaccination
    addVaccination = async (req, res) => {
        try {
            const { pet_id, vaccine_name, administered_on, notes, due_on: dueOnFromClient } = req.body;
            if (!pet_id || !vaccine_name || !administered_on) {
                return res.status(400).json({ success: false, error: 'pet_id, vaccine_name, and administered_on required' });
            }
            await assertPetOwner(req.user.id, pet_id); // guard

            // Auto-increment dose_number for same vaccine
            const last = await db.query_executor(
                'SELECT dose_number FROM vaccinations WHERE pet_id=$1 AND vaccine_name=$2 ORDER BY dose_number DESC LIMIT 1',
                [pet_id, vaccine_name]
            );
            const nextDose = last.rows.length ? last.rows[0].dose_number + 1 : 1;

            const computeDueOn = (adminDate, name) => {
                const d = new Date(adminDate);
                const vn = String(name || '').toLowerCase();

                if (['rabies', 'flu', 'fvrcp', 'dhpp', 'dapp'].includes(vn)) {
                    d.setFullYear(d.getFullYear() + 1);
                } else {
                    d.setMonth(d.getMonth() + 12);
                }
                return d.toISOString().split('T')[0];
            };

            const due_on = dueOnFromClient ? String(dueOnFromClient) : computeDueOn(administered_on, vaccine_name);

            const result = await this.careModel.addVaccination({
                pet_id,
                vaccine_name,
                dose_number: nextDose,
                administered_on,
                due_on,
                clinic_id: null,
                vet_user_id: null,
                certificate_url: null,
                notes
            });

            const row = result; 
            if (row) {
              await upsertDocs([{
                doc_id: `pet:${row.pet_id}:vax:${row.id}`,
                user_id: req.user.id,
                pet_id: Number(row.pet_id),
                doc_type: 'vaccination',
                content: `Vaccination ${row.vaccine_name} dose ${row.dose_number || '1'} on ${row.administered_on || '—'}. Next due ${row.due_on || '—'}. Notes: ${row.notes || '—'}.`
              }]);
            }
            return res.status(201).json({ vaccination: row });
        } catch (error) {
            return res.status(error.status || 500).json({ success: false, error: error.message || 'Internal server error' });
        }
    };

    // Deworming
    addDeworming = async (req, res) => {
        try {
            const { pet_id, product_name, administered_on, weight_based_dose, notes } = req.body;
            if (!pet_id || !product_name || !administered_on) {
                return res.status(400).json({ success: false, error: 'pet_id, product_name, and administered_on required' });
            }
            await assertPetOwner(req.user.id, pet_id); // guard

            const date = new Date(administered_on);
            date.setMonth(date.getMonth() + 3);
            const due_on = date.toISOString().split('T')[0];

            const result = await this.careModel.addDeworming({
                pet_id,
                product_name,
                administered_on,
                due_on,
                weight_based_dose,
                notes
            });

            const drow = result; 
            if (drow) {
              await upsertDocs([{
                doc_id: `pet:${drow.pet_id}:deworm:${drow.id}`,
                user_id: req.user.id,
                pet_id: Number(drow.pet_id),
                doc_type: 'deworming',
                content: `Deworming ${drow.product_name} on ${drow.administered_on || '—'}. Next due ${drow.due_on || '—'}. Dose: ${drow.weight_based_dose || '—'}. Notes: ${drow.notes || '—'}.`
              }]);
            }
            return res.status(201).json({ deworming: drow });
        } catch (error) {
            return res.status(error.status || 500).json({ success: false, error: error.message || 'Internal server error' });
        }
    };

    // Reminder
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

    // Notification
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

    getVaccinationsByPet = async (req, res) => {
        try {
            const { petId } = req.params;
            const result = await this.careModel.db.query_executor(
                'SELECT * FROM vaccinations WHERE pet_id=$1 ORDER BY administered_on DESC',
                [petId]
            );
            return res.status(200).json(result.rows);
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Failed to fetch vaccinations' });
        }
    };

    getDewormingsByPet = async (req, res) => {
        try {
            const { petId } = req.params;
            const result = await this.careModel.db.query_executor(
                'SELECT * FROM dewormings WHERE pet_id=$1 ORDER BY administered_on DESC',
                [petId]
            );
            return res.status(200).json(result.rows);
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Failed to fetch dewormings' });
        }
    };
}

module.exports = CareController;