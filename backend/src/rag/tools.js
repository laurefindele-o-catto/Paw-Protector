const { tool } = require('@langchain/core/tools');
const z = require('zod');
const DB_Connection = require('../database/db.js');
const { search } = require('./service.js');

const ragSearchTool = tool(
  async ({ query, pet_id, topK = 6, doc_types }, { configurable }) => {
    const userId = configurable?.user_id;
    // Use fallback to passed pet_id if tool argument is missing
    const effectivePetId = pet_id != null ? Number(pet_id) : (configurable?.pet_id ? Number(configurable.pet_id) : null);
    
    // 1. Fetch User & Pet Context
    const db = new DB_Connection();
    let context = { user: null, pet: null };
    
    try {
      if (userId) {
        const uRes = await db.query_executor(
          'SELECT full_name, email, phone_number FROM users WHERE id = $1', 
          [Number(userId)]
        );
        if (uRes.rows?.length) context.user = uRes.rows[0];

        if (effectivePetId) {
          const pRes = await db.query_executor(
            `SELECT name, species, breed, sex, birthdate, weight_kg, is_neutered, notes 
             FROM pets WHERE id = $1 AND owner_id = $2`,
            [Number(effectivePetId), Number(userId)]
          );
          if (pRes.rows?.length) {
            const p = pRes.rows[0];
            // Calculate age approximate
            let age = 'Unknown';
            if (p.birthdate) {
              const diffTime = Math.abs(new Date() - new Date(p.birthdate));
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              if (diffDays < 365) age = `${Math.floor(diffDays/30)} months`;
              else age = `${Math.floor(diffDays/365)} years`;
            }
            context.pet = { ...p, calculated_age: age };
          }
        }
      }
    } catch (err) {
      console.error("Error fetching context in rag_search:", err.message);
      // Continue even if context fetch fails
    }

    const out = await search({
      user_id: userId,
      query: query,
      topK: Number(topK) || 6,
      pet_id: effectivePetId,
      doc_types: Array.isArray(doc_types)
        ? doc_types
        : (typeof doc_types === 'string'
            ? doc_types.split(',').map(s => s.trim()).filter(Boolean)
            : [])
    });
    
    // Categorize results by source type for better agent context
    const userDocs = out.results.filter(r => r.metadata?.user_id !== '0');
    const knowledgeBaseDocs = out.results.filter(r => r.metadata?.user_id === '0');
    
    return JSON.stringify({
      context_data: context,
      total_count: out.results.length,
      user_specific_count: userDocs.length,
      knowledge_base_count: knowledgeBaseDocs.length,
      sources: out.results.map(r => ({
        id: r.id,
        source_type: r.metadata?.user_id === '0' ? 'knowledge_base' : 'user_data',
        doc_type: r.metadata?.doc_type,
        pet_id: r.metadata?.pet_id,
        category: r.metadata?.category,
        severity: r.metadata?.severity,
        content: r.content?.slice(0, 800)
      }))
    });
  },
  {
    name: 'rag_search',
    description: 'Retrieve the most relevant documents including veterinary knowledge base (first-aid, disease info) and user-specific pet data. Results include both global knowledge and pet history.',
    schema: z.object({
      query: z.string().describe('User question to embed and search for'),
      pet_id: z.number().nullable().optional(),
      topK: z.number().optional().describe('Number of results to return (default 6)'),
      doc_types: z.union([z.string(), z.array(z.string())]).optional().describe('Filter by doc types: first_aid, disease_guide, chat, care_plan, etc.')
    })
  }
);

const petCardTool = tool(
  async ({ pet_id }, { configurable }) => {
    const userId = configurable?.user_id;
    const effectivePetId = pet_id != null ? Number(pet_id) : (configurable?.pet_id ? Number(configurable.pet_id) : null);
    if (!effectivePetId) return 'No pet_id provided.';
    const db = new DB_Connection();
    const q = `
      SELECT id, owner_id, name, species, breed, sex, birthdate, weight_kg, notes, is_neutered
      FROM pets WHERE id = $1 AND owner_id = $2 LIMIT 1
    `;
    const r = await db.query_executor(q, [Number(effectivePetId), Number(userId)]);
    const p = r.rows?.[0];
    if (!p) return 'Pet not found for this user.';
    return `Pet ${p.name} (${p.species}), sex=${p.sex}, breed=${p.breed || '—'}, birthdate=${p.birthdate || '—'}, weight=${p.weight_kg ?? '—'}kg. Notes: ${p.notes || '—'}.`;
  },
  {
    name: 'get_pet_card',
    description: 'Get a concise profile summary for a pet owned by the current user.',
    schema: z.object({
      pet_id: z.number().optional().describe('The pet id to fetch (defaults to current session pet)')
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
    description: 'Find nearby vets (by joining vet profile with clinic/home location) from lat/lng or find the vet if the user wants the list of the vets.',
    schema: z.object({
      lat: z.number().describe('Latitude'),
      lng: z.number().describe('Longitude'),
      limit: z.number().optional()
    })
  }
);

// Weekly metrics (reads from pet_health_metrics)
const weeklyMetricsTool = tool(
  async ({ pet_id, lookback_weeks = 8 }, { configurable }) => {
    const effectivePetId = pet_id != null ? Number(pet_id) : (configurable?.pet_id ? Number(configurable.pet_id) : null);
    if (!effectivePetId) return 'pet_id required';
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
    const rs = await db.query_executor(q, [Number(effectivePetId), Number(lookback_weeks)]);
    const q2 = `
      SELECT MAX(measured_at) AS last_updated
      FROM pet_health_metrics
      WHERE pet_id = $1
    `;
    const rs2 = await db.query_executor(q2, [Number(effectivePetId)]);
    return JSON.stringify({
      last_updated: rs2.rows?.[0]?.last_updated || null,
      weeks: rs.rows || []
    });
  },
  {
    name: 'get_pet_metrics_weekly',
    description: 'Get last N weeks of health metrics grouped by week from pet_health_metrics.',
    schema: z.object({
      pet_id: z.number().optional().describe('Pet id'),
      lookback_weeks: z.number().optional()
    })
  }
);

const healthRecordsTool = tool(
  async ({ pet_id, limit_diseases = 12, limit_vaccinations = 20, limit_dewormings = 20 }, { configurable }) => {
    const userId = configurable?.user_id;
    const effectivePetId = pet_id != null ? Number(pet_id) : (configurable?.pet_id ? Number(configurable.pet_id) : null);
    if (!effectivePetId) return 'pet_id required';

    const db = new DB_Connection();
    // Ownership guard
    const own = await db.query_executor(
      `SELECT 1 FROM pets WHERE id = $1 AND owner_id = $2 LIMIT 1`,
      [Number(effectivePetId), Number(userId)]
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
      db.query_executor(diseasesQ, [Number(effectivePetId), Number(limit_diseases)]),
      db.query_executor(vaccinationsQ, [Number(effectivePetId), Number(limit_vaccinations)]),
      db.query_executor(dewormingsQ, [Number(effectivePetId), Number(limit_dewormings)])
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
      pet_id: z.number().optional().describe('Pet id'),
      limit_diseases: z.number().optional(),
      limit_vaccinations: z.number().optional(),
      limit_dewormings: z.number().optional()
    })
  }
);

module.exports = { ragSearchTool, petCardTool, nearbyVetsTool, weeklyMetricsTool, healthRecordsTool };