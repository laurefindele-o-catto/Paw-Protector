// PATCH: add polishSummary + ensureDailyReminders and apply before saving.

const CareModel = require('../models/careModel.js');
const DB_Connection = require('../database/db.js');
const { upsertDocs } = require('../rag/service.js');
const { ChatOpenAI } = require('@langchain/openai');
const { getCareAgent } = require('../rag/agentGraph.js');
const { similaritySearchDualRaw } = require('../rag/vectorStore.js');
const db = new DB_Connection();

function startOfWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
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

// NEW: summary polish + inject daily reminders when missing
function possessiveBn(name) {
  if (!name) return '';
  return name.endsWith('র') ? name : `${name}র`;
}
function polishSummary(summary, petName) {
  if (!summary || typeof summary !== 'object') return summary;
  const out = { ...summary };
  const poss = possessiveBn(petName);
  if (out.current_status_bn) {
    let s = out.current_status_bn.trim();
    if (petName && s.includes(`${petName} আজ`)) s = s.replace(`${petName} আজ`, `${poss} আজ`);
    if (/(জ্বর|বমি)/.test(s) && !/চিন্তিত/.test(s)) {
      const parts = s.split('।').filter(Boolean);
      if (parts.length) {
        parts.splice(1, 0, 'আমি বেশ চিন্তিত');
        s = parts.join('।') + '।';
      }
    }
    out.current_status_bn = s.replace(/\s+/g, ' ');
  }
  if (out.trend_bn) {
    let t = out.trend_bn.replace(/\s+/g, ' ').trim();
    if (!/(খেয়াল রাখো|খেয়াল রেখো)/.test(t)) t = `${t}। তুমি ভালোমতো খেয়াল রেখো।`;
    out.trend_bn = t;
  }
  return out;
}
function ensureDailyReminders(plan) {
  if (!plan?.days) return plan;
  const base = [
    'Hydration ও appetite নজর রাখো — ছোট ছোট খাবার + ২–৩টি পানির উৎস।',
    'তাপমাত্রা / বমি লক্ষণ নোট করো।',
    'শান্ত পরিবেশ + gentle play, stress কমাও।',
    'খাবার সহজে পৌঁছায় কিনা দেখো; ছোট portion।',
    'জ্বর/বমি না কমলে vet plan করো।',
    'Grooming + fresh water top‑up + litter পরিষ্কার।',
    'সপ্তাহ সারাংশ নাও; vet visit লাগবে কিনা ভাবো।'
  ];
  const days = plan.days.map((d, i) => {
    const r = Array.isArray(d.reminders) ? d.reminders.filter(Boolean) : [];
    if (r.length === 0) r.push(base[i % base.length]);
    return { ...d, reminders: r };
  });
  // weave first global reminder mid-week
  const g1 = plan.global_reminders?.[0];
  if (g1 && days.length) {
    const mid = Math.min(3, days.length - 1);
    if (!days[mid].reminders.some(x => x.includes(g1))) {
      days[mid].reminders = [...days[mid].reminders, g1];
    }
  }
  return { ...plan, days };
}

function extractFirstJsonObject(text) {
  if (!text) return null;
  const s = String(text);
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}

function datesForWeek(week_start) {
  const base = new Date(`${week_start}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
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
      const fresh = lastUpdated ? (now - new Date(lastUpdated)) <= 7 * 24 * 60 * 60 * 1000 : false;
      if (!fresh && !force) {
        return res.status(412).json({
          success: false,
          code: 'METRICS_OUTDATED',
            message_bn: 'গত ৭ দিনের মধ্যে health metrics আপডেট নেই। আপডেট না করা পর্যন্ত কার্ড তৈরি করা যাবে না।'
        });
      }

      const week_start = startOfWeek(now);

      const petRs = await db.query_executor(
        `SELECT id, name, species, breed, sex, birthdate, weight_kg, notes, is_neutered
         FROM pets WHERE id=$1 AND owner_id=$2 LIMIT 1`,
        [Number(pet_id), Number(userId)]
      );
      const pet = petRs.rows?.[0] || null;
      const petName = pet?.name || '';

      // Ensure there's at least one stable "pet_summary" doc in the personal RAG table.
      try {
        if (pet) {
          await upsertDocs([
            {
              doc_id: `pet:${pet.id}:summary`,
              user_id: userId,
              pet_id: Number(pet.id),
              doc_type: 'pet_summary',
              content: `Pet ${pet.name} (${pet.species || 'unknown'}), sex=${pet.sex || '—'}, breed=${pet.breed || '—'}, birthdate=${pet.birthdate || '—'}, weight=${pet.weight_kg ?? '—'}kg, neutered=${pet.is_neutered ? 'yes' : 'no'}. Notes: ${pet.notes || '—'}.`
            }
          ]);
        }
      } catch {}

      // Fetch two contexts from two RAG tables:
      // - personal: pet info/current health/diseases/etc
      // - kb: care guide references only
      const personalDocTypes = [
        'pet_summary',
        'metric',
        'disease',
        'vaccination',
        'deworming',
        'vaccine_timeline',
        'life_stage',
        'care_summary',
        'care_plan',
        'chat'
      ];
      const kbDocTypes = ['care_guide'];

      const retrievalQuery = [
        `Weekly care plan for pet ${petName || pet_id}`,
        `Week start ${week_start}`,
        'diet hydration feeding routine grooming litter play enrichment',
        'diseases symptoms monitoring vaccinations deworming',
        'safety toxic foods household hazards'
      ].join('. ');

      const retrieved = await similaritySearchDualRaw({
        user_id: userId,
        query: retrievalQuery,
        pet_id: Number(pet_id),
        personal_doc_types: personalDocTypes,
        kb_doc_types: kbDocTypes,
        topKPersonal: 10,
        topKKB: 8
      });

      const formatHit = (h, idx) => {
        const dt = h?.metadata?.doc_type || 'doc';
        const did = h?.metadata?.doc_id || '';
        return `#${idx + 1} (${dt}) ${did}\n${String(h?.content || '').slice(0, 1200)}`.trim();
      };

      const personalHits = retrieved.personal || [];
      const guideHits = retrieved.kb || [];

      const personalContext = personalHits.map(formatHit).join('\n\n').slice(0, 8000);
      const guideContext = guideHits.map(formatHit).join('\n\n').slice(0, 8000);

      const sources = {
        personal: personalHits.map(h => ({
          id: h.id,
          doc_id: h?.metadata?.doc_id || null,
          doc_type: h?.metadata?.doc_type || null,
          score: typeof h.score === 'number' ? h.score : null,
          snippet: String(h?.content || '').slice(0, 280)
        })),
        guide: guideHits.map(h => ({
          id: h.id,
          doc_id: h?.metadata?.doc_id || null,
          doc_type: h?.metadata?.doc_type || null,
          score: typeof h.score === 'number' ? h.score : null,
          snippet: String(h?.content || '').slice(0, 280)
        }))
      };

      const llm = new ChatOpenAI({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: Number(process.env.OPENAI_TEMPERATURE ?? 0.2),
        apiKey: process.env.OPENAI_API_KEY
      });

      const system = `You generate a weekly pet-care flashcard plan.
Rules:
- Use BOTH contexts:
  (A) PersonalContext = this user's pet info/current health/diseases/metrics.
  (B) CareGuideContext = general care guide reference.
- If PersonalContext mentions active disease/symptoms, be conservative and add monitoring + vet-contact reminder.
- No prescriptions, no dosing, no human medicines.
- Output MUST be valid JSON only (no markdown).

JSON schema:
{
  "allow": true,
  "summary": { "current_status_bn": string, "trend_bn": string },
  "plan": {
    "global_reminders": string[],
    "days": [
      {
        "date": "YYYY-MM-DD",
        "morning": string[],
        "midday": string[],
        "evening": string[],
        "reminders": string[]
      }
    ]
  }
}

Constraints:
- Exactly 7 days.
- Each of morning/midday/evening max 4 bullets.
- Each day reminders 1–2 bullets.`;

      const dates = datesForWeek(week_start);
      const userMsg = [
        `pet_id=${pet_id}`,
        pet ? `PetProfile: name=${pet.name}, species=${pet.species || '—'}, breed=${pet.breed || '—'}, sex=${pet.sex || '—'}, birthdate=${pet.birthdate || '—'}, weight_kg=${pet.weight_kg ?? '—'}, neutered=${pet.is_neutered ? 'yes' : 'no'}` : '',
        `week_start=${week_start}`,
        `RequiredDates: ${dates.join(', ')}`,
        `\nPersonalContext:\n${personalContext || '—'}`,
        `\nCareGuideContext:\n${guideContext || '—'}`
      ].filter(Boolean).join('\n');

      const reply = await llm.invoke([
        { role: 'system', content: system },
        { role: 'user', content: userMsg }
      ]);

      const raw = String(reply?.content || '').trim();
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const extracted = extractFirstJsonObject(raw);
        if (!extracted) {
          return res.status(500).json({ success: false, error: 'Model did not return valid JSON' });
        }
        parsed = JSON.parse(extracted);
      }

      if (!parsed || typeof parsed !== 'object') {
        return res.status(500).json({ success: false, error: 'Model output missing JSON object' });
      }

      if (parsed.allow === false) {
        return res.status(412).json({
          success: false,
          code: 'PLAN_GENERATION_BLOCKED',
          message_bn: parsed.reason_bn || 'এই সপ্তাহে কার্ড তৈরি অনুমোদিত নয়।'
        });
      }

      // Normalize plan days to exactly 7 dates.
      const inDays = Array.isArray(parsed?.plan?.days) ? parsed.plan.days : [];
      const normalizedDays = dates.map((date, i) => {
        const d = inDays[i] || {};
        return {
          date,
          morning: Array.isArray(d.morning) ? d.morning.filter(Boolean).slice(0, 4) : [],
          midday: Array.isArray(d.midday) ? d.midday.filter(Boolean).slice(0, 4) : [],
          evening: Array.isArray(d.evening) ? d.evening.filter(Boolean).slice(0, 4) : [],
          reminders: Array.isArray(d.reminders) ? d.reminders.filter(Boolean).slice(0, 2) : []
        };
      });

      const planObj = {
        global_reminders: Array.isArray(parsed?.plan?.global_reminders) ? parsed.plan.global_reminders.filter(Boolean).slice(0, 6) : [],
        days: normalizedDays
      };

      parsed.summary = parsed.summary && typeof parsed.summary === 'object' ? parsed.summary : {};
      if (!parsed.summary.current_status_bn) parsed.summary.current_status_bn = 'এই সপ্তাহে নিয়মিত রুটিন + নজরদারি চালিয়ে যাও।';
      if (!parsed.summary.trend_bn) parsed.summary.trend_bn = 'Hydration, appetite, litter habits—এই ৩টা খেয়াল রেখো।';

      const polishedSummary = polishSummary(parsed.summary, petName);
      const fixedPlan = ensureDailyReminders(planObj);

      const saved = await this.careModel.upsertCarePlan({
        pet_id: Number(pet_id),
        week_start,
        summary_json: polishedSummary,
        plan_json: fixedPlan,
        sources
      });

      try {
        await upsertDocs([
          {
            doc_id: `care_summary:${pet_id}:${week_start}`,
            user_id: userId,
            pet_id: Number(pet_id),
            doc_type: 'care_summary',
            content: `${polishedSummary.current_status_bn || ''} ${polishedSummary.trend_bn || ''}`.trim(),
            metadata: { week_start }
          },
          {
            doc_id: `care_plan:${pet_id}:${week_start}`,
            user_id: userId,
            pet_id: Number(pet_id),
            doc_type: 'care_plan',
            content: JSON.stringify(fixedPlan),
            metadata: { week_start }
          }
        ]);
      } catch {}

      return res.status(201).json({
        success: true,
        week_start,
        summary: polishedSummary,
        plan: fixedPlan,
        sources,
        retrieval: { personal: personalHits.length, guide: guideHits.length },
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
      return res.json({ success: true, week_start, summary: row.summary_json, plan: row.plan_json, sources: row.sources || null });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  };

  getSummary = async (req, res) => {
    try {
      const userId = req.user?.id;
      
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

  getVaccineTimeline = async (req, res) => {
    try {
      const userId = req.user?.id;
      const pet_id = Number(req.query.pet_id);
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      if (!pet_id) return res.status(400).json({ success: false, error: 'pet_id required' });
      await assertPetOwner(userId, pet_id);

      // Fetch vaccinations
      const existing = await this.careModel.getVaccinationsByPet(pet_id, 50);
      // Compute age in months
      const petRow = await db.query_executor(`SELECT birthdate, species FROM pets WHERE id=$1 LIMIT 1`, [pet_id]);
      const birth = petRow.rows?.[0]?.birthdate ? new Date(petRow.rows[0].birthdate) : null;
      const ageMonths = birth ? Math.max(0, Math.floor((Date.now() - birth.getTime()) / (1000*60*60*24*30.4))) : null;

      // Base feline sequence (extend species switch later)
      const base = [
        { label: "6–8 wks", sub: "FVRCP #1" },
        { label: "10–12 wks", sub: "FVRCP #2" },
        { label: "14–16 (to 20) wks", sub: "FVRCP #3 + Rabies*" },
        { label: "6–12 mo", sub: "Boosters" },
        { label: "Adult", sub: "FVRCP ~q3y; Rabies per law" }
      ];

      // Mark status based on existing doses & due_on
      const today = new Date().toISOString().slice(0,10);
      const completedRabies = existing.filter(v=>v.vaccine_name.toLowerCase()==='rabies').length;
      const completedFVRCP = existing.filter(v=>v.vaccine_name.toLowerCase()==='fvcpr' || v.vaccine_name.toLowerCase()==='fvrxp' || v.vaccine_name.toLowerCase()==='fvrcp').length; // loose matches
      const enriched = base.map((step,i)=> {
        let status = 'pending';
        let due_on = null;
        if (step.sub.includes('FVRCP') && completedFVRCP > i) status='completed';
        if (step.sub.includes('Rabies') && completedRabies >= 1) status='completed';
        // rough overdue heuristic
        if (status==='pending' && ageMonths != null) {
          // If age already past nominal window, mark overdue
          if (i===0 && ageMonths>2) status='overdue';
          if (i===1 && ageMonths>3) status='overdue';
          if (i===2 && ageMonths>5) status='overdue';
          if (i===3 && ageMonths>13) status='overdue';
        }
        return { ...step, status, due_on };
      });

      // Optional agent refinement - need to replace later for more control
      let note = null;
      try {
        const agent = getCareAgent();
        const configurable = { thread_id: `vax-${userId}-${pet_id}`, user_id: userId, pet_id };
        const prompt = `Provide one short Bangla+English mixed sentence summarizing vaccine timeline status for pet_id=${pet_id}, age_months=${ageMonths}, existing=${existing.length}. Do NOT repeat full schedule; just next or overdue item.`;
        const r = await agent.invoke({ messages:[{role:'user', content: prompt}] }, { configurable });
        note = String(r.messages.at(-1).content || '').slice(0,180);
      } catch {}

      // Upsert to vector store
      try {
        await upsertDocs([{
          doc_id: `vaccine_timeline:${pet_id}:${Date.now()}`,
          user_id: userId,
          pet_id,
          doc_type: 'vaccine_timeline',
          content: JSON.stringify({ steps: enriched, note }),
          metadata: { age_months: ageMonths }
        }]);
      } catch {}

      return res.json({ success: true, pet_id, age_months: ageMonths, steps: enriched, note });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  };

  getLifeStages = async (req, res) => {
    try {
      const userId = req.user?.id;
      const pet_id = Number(req.query.pet_id);
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      if (!pet_id) return res.status(400).json({ success: false, error: 'pet_id required' });
      await assertPetOwner(userId, pet_id);
      const petRow = await db.query_executor(`SELECT birthdate, species FROM pets WHERE id=$1 LIMIT 1`, [pet_id]);
      const birth = petRow.rows?.[0]?.birthdate ? new Date(petRow.rows[0].birthdate) : null;
      const ageMonths = birth ? Math.max(0, Math.floor((Date.now() - birth.getTime()) / (1000*60*60*24*30.4))) : null;

      const stages = [
        { label: "Kittens", range: "0–12 m", key: "3x→2x meals; socialization; vaccine series", emoji:"🍼" },
        { label: "Adults", range: "1–10 y", key: "Stable diet; annual vet; enrichment rotation", emoji:"💪" },
        { label: "Seniors", range: "10+ y", key: "Biannual vet; joint comfort; easy access", emoji:"🧣" }
      ].map(s => {
        let active = false;
        if (ageMonths != null) {
          if (ageMonths <= 12) active = s.label === "Kittens";
          else if (ageMonths < 120) active = s.label === "Adults";
          else active = s.label === "Seniors";
        }
        return { ...s, active };
      });

      let summary = null;
      try {
        const agent = getCareAgent();
        const configurable = { thread_id: `stage-${userId}-${pet_id}`, user_id: userId, pet_id };
        const prompt = `One concise Bangla+English mixed sentence: current life stage and 1 key care focus for age_months=${ageMonths}.`;
        const r = await agent.invoke({ messages:[{role:'user', content: prompt}] }, { configurable });
        summary = String(r.messages.at(-1).content || '').slice(0,140);
      } catch {}

      try {
        await upsertDocs([{
          doc_id: `life_stage:${pet_id}:${Date.now()}`,
          user_id: userId,
          pet_id,
          doc_type: 'life_stage',
          content: JSON.stringify({ stages, summary }),
          metadata: { age_months: ageMonths }
        }]);
      } catch {}

      return res.json({ success: true, pet_id, age_months: ageMonths, stages, summary });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  };
}

module.exports = CareController;