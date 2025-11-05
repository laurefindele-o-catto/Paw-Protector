const {getVectorStore, similaritySearchRaw} = require('./vectorStore.js');

const upsertDocs = async(docs=[])=>{
    if(!Array.isArray(docs) || docs.length === 0){
        return {
            inserted: 0
        };
    }

    const mapped = docs.map(d => ({
        pageContent: d.content || '',
        metadata: {
        doc_id: d.doc_id,
        user_id: String(d.user_id),
        pet_id: d.pet_id != null ? String(d.pet_id) : null,
        doc_type: d.doc_type,
        ...(d.metadata || {})
        }
    }));

    const store = await getVectorStore();
    await store.addDocuments(mapped);
    return {
        inserted: mapped.length
    };
}

async function search({ user_id, query, topK = 6, pet_id = null, doc_types = [] }) {
  const results = await similaritySearchRaw({ user_id, query, topK, pet_id, doc_types });
  console.log(results);
  
  return { results };
}

module.exports = { upsertDocs, search };