const { tool } = require('@langchain/core/tools');
const z = require('zod');
const DB_Connection = require('../database/db.js');
const { search } = require('./service.js');

const ragSearchTool = tool(
  async ({ query, pet_id, topK = 6, doc_types }, { configurable }) => {
    const userId = configurable?.user_id;
    const out = await search({
      user_id: userId,
      query: query,
      topK: Number(topK) || 6,
      pet_id: pet_id != null ? Number(pet_id) : null,
      doc_types: Array.isArray(doc_types)
        ? doc_types
        : (typeof doc_types === 'string'
            ? doc_types.split(',').map(s => s.trim()).filter(Boolean)
            : [])
    });
    return JSON.stringify({
      count: out.results.length,
      sources: out.results.map(r => ({
        id: r.id,
        doc_type: r.metadata?.doc_type,
        pet_id: r.metadata?.pet_id,
        content: r.content?.slice(0, 800)
      }))
    });
  },
  {
    name: 'rag_search',
    description: 'Retrieve the most relevant pet-specific documents via vector search.',
    schema: z.object({
      query: z.string().describe('User question to embed and search for'),
      pet_id: z.number().nullable().optional(),
      topK: z.number().optional(),
      doc_types: z.union([z.string(), z.array(z.string())]).optional()
    })
  }
);

const petCardTool = tool(
  async ({ pet_id }, { configurable }) => {
    const userId = configurable?.user_id;
    if (!pet_id) return 'No pet_id provided.';
    const db = new DB_Connection();
    const q = `
      SELECT id, owner_id, name, species, breed, sex, birthdate, weight_kg, notes, is_neutered
      FROM pets WHERE id = $1 AND owner_id = $2 LIMIT 1
    `;
    const r = await db.query_executor(q, [Number(pet_id), Number(userId)]);
    const p = r.rows?.[0];
    if (!p) return 'Pet not found for this user.';
    return `Pet ${p.name} (${p.species}), sex=${p.sex}, breed=${p.breed || '—'}, birthdate=${p.birthdate || '—'}, weight=${p.weight_kg ?? '—'}kg. Notes: ${p.notes || '—'}.`;
  },
  {
    name: 'get_pet_card',
    description: 'Get a concise profile summary for a pet owned by the current user.',
    schema: z.object({
      pet_id: z.number().describe('The pet id to fetch')
    })
  }
);

const nearbyVetsTool = tool(
  async ({ lat, lng, limit = 5 }) => {
    if (!(lat != null && lng != null)) return 'Latitude/Longitude required.';
    const db = new DB_Connection();
    const sql = `
      SELECT
        v.user_id            AS vet_user_id,
        v.name               AS vet_name,
        v.specialization,
        v.verified,
        c.id                 AS clinic_id,
        c.name               AS clinic_name,
        c.phone,
        c.email,
        c.address,
        c.latitude,
        c.longitude,
        (6371 * acos(
          cos(radians($1)) * cos(radians(c.latitude)) *
          cos(radians(c.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(c.latitude))
        )) AS distance_km
      FROM vets v
      JOIN vet_clinics c ON c.id = v.clinic_id
      WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT $3;
    `;
    const rs = await db.query_executor(sql, [Number(lat), Number(lng), Number(limit)]);
    return JSON.stringify(
      (rs.rows || []).map(r => ({
        vet_user_id: r.vet_user_id,
        vet_name: r.vet_name,
        specialization: r.specialization,
        verified: !!r.verified,
        clinic_id: r.clinic_id,
        clinic_name: r.clinic_name,
        phone: r.phone,
        address: r.address,
        distance_km: Number(r.distance_km?.toFixed?.(1) || 0)
      }))
    );
  },
  {
    name: 'find_nearby_vets',
    description: 'Find nearby vets (by joining vet profile with clinic/home location) from lat/lng.',
    schema: z.object({
      lat: z.number().describe('Latitude'),
      lng: z.number().describe('Longitude'),
      limit: z.number().optional()
    })
  }
);

// Weekly metrics (reads from pet_health_metrics)
const weeklyMetricsTool = tool(
  async ({ pet_id, lookback_weeks = 8 }) => {
    if (!pet_id) return 'pet_id required';
    const db = new DB_Connection();
    const q = `
      SELECT
        date_trunc('week', h.measured_at)::date AS week_start,
        json_agg(
          json_build_object(
            'at',                h.measured_at,
            'weight_kg',         h.weight_kg,
            'body_temp_c',       h.body_temp_c,
            'heart_rate_bpm',    h.heart_rate_bpm,
            'respiration_rate_bpm', h.respiration_rate_bpm,
            'note',              h.note
          )
          ORDER BY h.measured_at ASC
        ) AS points
      FROM pet_health_metrics h
      WHERE h.pet_id = $1
        AND h.measured_at >= (NOW() - ($2 || ' weeks')::interval)
      GROUP BY 1
      ORDER BY 1 DESC;
    `;
    const rs = await db.query_executor(q, [Number(pet_id), Number(lookback_weeks)]);
    const q2 = `
      SELECT MAX(measured_at) AS last_updated
      FROM pet_health_metrics
      WHERE pet_id = $1
    `;
    const rs2 = await db.query_executor(q2, [Number(pet_id)]);
    return JSON.stringify({
      last_updated: rs2.rows?.[0]?.last_updated || null,
      weeks: rs.rows || []
    });
  },
  {
    name: 'get_pet_metrics_weekly',
    description: 'Get last N weeks of health metrics grouped by week from pet_health_metrics.',
    schema: z.object({
      pet_id: z.number().describe('Pet id'),
      lookback_weeks: z.number().optional()
    })
  }
);

const healthRecordsTool = tool(
  async ({ pet_id, limit_diseases = 12, limit_vaccinations = 20, limit_dewormings = 20 }, { configurable }) => {
    if (!pet_id) return 'pet_id required';
    const userId = configurable?.user_id;
    const db = new DB_Connection();
    // Ownership guard
    const own = await db.query_executor(
      `SELECT 1 FROM pets WHERE id = $1 AND owner_id = $2 LIMIT 1`,
      [Number(pet_id), Number(userId)]
    );
    if (!own.rows?.length) return 'Pet not found for this user.';

    const diseasesQ = `
      SELECT id, disease_name, symptoms, severity, status, diagnosed_on, resolved_on
      FROM pet_diseases
      WHERE pet_id = $1
      ORDER BY diagnosed_on DESC NULLS LAST, id DESC
      LIMIT $2;
    `;
    const vaccinationsQ = `
      SELECT id, vaccine_name, dose_number, administered_on, due_on, notes
      FROM vaccinations
      WHERE pet_id = $1
      ORDER BY administered_on DESC NULLS LAST, id DESC
      LIMIT $2;
    `;
    const dewormingsQ = `
      SELECT id, product_name, administered_on, due_on, weight_based_dose, notes
      FROM dewormings
      WHERE pet_id = $1
      ORDER BY administered_on DESC NULLS LAST, id DESC
      LIMIT $2;
    `;

    const [dRes, vRes, wRes] = await Promise.all([
      db.query_executor(diseasesQ, [Number(pet_id), Number(limit_diseases)]),
      db.query_executor(vaccinationsQ, [Number(pet_id), Number(limit_vaccinations)]),
      db.query_executor(dewormingsQ, [Number(pet_id), Number(limit_dewormings)])
    ]);

    return JSON.stringify({
      diseases: dRes.rows || [],
      vaccinations: vRes.rows || [],
      dewormings: wRes.rows || []
    });
  },
  {
    name: 'get_pet_health_records',
    description: 'Retrieve recent diseases, vaccinations, and dewormings for a pet (owned by current user).',
    schema: z.object({
      pet_id: z.number().describe('Pet id'),
      limit_diseases: z.number().optional(),
      limit_vaccinations: z.number().optional(),
      limit_dewormings: z.number().optional()
    })
  }
);

module.exports = { ragSearchTool, petCardTool, nearbyVetsTool, weeklyMetricsTool, healthRecordsTool };