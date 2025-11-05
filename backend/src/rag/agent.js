const { ChatOpenAI } = require('@langchain/openai');
const DB_Connection = require('../database/db.js');
const { search } = require('./service.js');

async function getPetCard(petId, userId) {
    if (!petId) return null;
    const db = new DB_Connection();
    const q = `
        SELECT id, owner_id, name, species, breed, sex, birthdate, weight_kg, notes
        FROM pets WHERE id = $1 AND owner_id = $2 LIMIT 1
    `;
    const r = await db.query_executor(q, [Number(petId), Number(userId)]);
    const p = r.rows?.[0];
    if (!p) return null;
    return `Pet ${p.name} (${p.species}), sex=${p.sex}, breed=${p.breed || '—'}, birthdate=${p.birthdate || '—'}, weight=${p.weight_kg ?? '—'}kg. Notes: ${p.notes || '—'}.`;
}

async function findNearbyVets({ lat, lng, limit = 5 }) {
  if (!(lat && lng)) return [];
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
  return rs.rows || [];
}

async function ask({ userId, q, petId = null, docTypes = [], topK = 6, userLocation = null }) {
  const petCard = await getPetCard(petId, userId);
  const hits = await search({
    user_id: userId,
    query: q,
    topK: Number(topK) || 6,
    pet_id: petId ? Number(petId) : null,
    doc_types: Array.isArray(docTypes) ? docTypes : (typeof docTypes === 'string' ? docTypes.split(',').map(s=>s.trim()).filter(Boolean) : [])
  });

  const context = (hits.results || [])
    .map((h, i) => `#${i+1} (${h.metadata?.doc_type || 'doc'})\n${h.content}`)
    .join('\n\n')
    .slice(0, 8000);

  const nearby = userLocation?.lat && userLocation?.lng
    ? await findNearbyVets({ lat: userLocation.lat, lng: userLocation.lng, limit: 5 })
    : [];

  const llm = new ChatOpenAI({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: Number(process.env.OPENAI_TEMPERATURE ?? 0),
    apiKey: process.env.OPENAI_API_KEY
  });

  const system = `You are a veterinary assistant.
    - Use ONLY the provided context and pet card.
    - Ask brief follow-ups if key info is missing (fever, vomiting, rash, duration).
    - If serious symptoms, advise contacting a vet; list nearby clinics if provided.
    - Keep answers short and practical.`;

  const userMsg = [
    `Question: ${q}`,
    `PetCard: ${petCard || '—'}`,
    `Context:\n${context || '—'}`,
    nearby.length ? `NearbyVets:\n${nearby.map(v => `- ${v.name} (${(v.distance_km||0).toFixed(1)}km) ${v.phone || ''}`).join('\n')}` : ''
  ].join('\n\n');

  const reply = await llm.invoke([
    { role: 'system', content: system },
    { role: 'user', content: userMsg }
  ]);

  return {
    answer: String(reply?.content || '').trim(),
    results: hits.results || [],
    nearby
  };
}

module.exports = { ask };