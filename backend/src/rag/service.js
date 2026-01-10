const { similaritySearchRaw, TABLE_NAME_KB, TABLE_NAME_PERSONAL } = require('./vectorStore.js');
const { getEmbeddings } = require('./embeddings.js');
const DB_Connection = require('../database/db.js');

const upsertDocs = async(docs=[])=>{
    if(!Array.isArray(docs) || docs.length === 0){
        return {
            inserted: 0
        };
    }

    // 1. Generate Embeddings for all docs
    const embeddings = await getEmbeddings();
    const contents = docs.map(d => d.content || '');
    const vectors = await embeddings.embedDocuments(contents);

    const db = new DB_Connection();

    // 2. Prepare records
    const kbRecords = [];
    const personalRecords = [];

    docs.forEach((d, i) => {
        // Construct complete metadata including top-level fields for consistency
        const meta = {
            doc_id: d.doc_id,
            user_id: String(d.user_id),
            pet_id: d.pet_id != null ? String(d.pet_id) : null,
            doc_type: d.doc_type,
            ...(d.metadata || {})
        };

        const record = {
            doc_id: d.doc_id,
            user_id: String(d.user_id),
            pet_id: d.pet_id != null ? String(d.pet_id) : null,
            doc_type: d.doc_type || 'unknown',
            content: d.content || '',
            metadata: meta,
            embedding: `[${vectors[i].join(',')}]`
        };

        if (record.user_id === '0') {
            kbRecords.push(record);
        } else {
            personalRecords.push(record);
        }
    });

    let count = 0;

    // 3. Insert loop
    const insertBatch = async (table, records) => {
        for (const r of records) {
             const query = `
                INSERT INTO ${table} (doc_id, user_id, pet_id, doc_type, content, metadata, embedding)
                VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
                ON CONFLICT (doc_id) DO UPDATE SET
                    content = EXCLUDED.content,
                    metadata = EXCLUDED.metadata,
                    embedding = EXCLUDED.embedding,
                    updated_at = NOW();
             `;
             
             try {
                await db.query_executor(query, [
                    r.doc_id, 
                    r.user_id, 
                    r.pet_id, 
                    r.doc_type, 
                    r.content, 
                    r.metadata, 
                    r.embedding
                ]);
                count++;
             } catch (err) {
                 console.error(`Failed to insert doc ${r.doc_id} into ${table}:`, err.message);
                 // We continue insertion of other docs
             }
        }
    };

    if (kbRecords.length > 0) {
        await insertBatch(TABLE_NAME_KB, kbRecords);
    }

    if (personalRecords.length > 0) {
        await insertBatch(TABLE_NAME_PERSONAL, personalRecords);
    }

    return {
        inserted: count
    };
}

async function search({ user_id, query, topK = 6, pet_id = null, doc_types = [] }) {
  const results = await similaritySearchRaw({ user_id, query, topK, pet_id, doc_types });
  console.log(results);
  return { results };
}

module.exports = { upsertDocs, search };