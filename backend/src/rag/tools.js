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
      SELECT id, name, phone, email, address, latitude, longitude,
        (6371 * acos(
          cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )) AS distance_km
      FROM vet_clinics
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT $3;
    `;
    const rs = await db.query_executor(sql, [Number(lat), Number(lng), Number(limit)]);
    return JSON.stringify(
      (rs.rows || []).map(v => ({
        id: v.id,
        name: v.name,
        phone: v.phone,
        address: v.address,
        distance_km: Number(v.distance_km?.toFixed?.(1) || 0)
      }))
    );
  },
  {
    name: 'find_nearby_vets',
    description: 'Find nearby vet clinics from lat/lng.',
    schema: z.object({
      lat: z.number().describe('Latitude'),
      lng: z.number().describe('Longitude'),
      limit: z.number().optional()
    })
  }
);

module.exports = { ragSearchTool, petCardTool, nearbyVetsTool };