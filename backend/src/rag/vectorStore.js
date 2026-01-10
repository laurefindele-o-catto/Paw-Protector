const DB_Connection = require('../database/db.js');
const {getEmbeddings} = require('./embeddings.js');
const {PGVectorStore} = require('@langchain/community/vectorstores/pgvector');
const {Pool} = require('pg');
const path = require('path');
const dotenv = require('dotenv');

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

let _storeKB = null;
let _storePersonal = null;

// The default table (Knowledge Base, Guidelines)
const TABLE_NAME_KB = process.env.RAG_TABLE_NAME || 'rag_documents_lc';
// The new personalized table (Chats, Health Records)
const TABLE_NAME_PERSONAL = 'rag_documents_personal';

const getVectorStore = async (type = 'kb') => {
  const embeddings = await getEmbeddings();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Missing DATABASE_URL');

  if (type === 'personal') {
      if (_storePersonal) return _storePersonal;
      _storePersonal = await PGVectorStore.initialize(embeddings, {
          postgresConnectionOptions: { connectionString },
          tableName: TABLE_NAME_PERSONAL,
          columns: {
              idColumnName: 'id',
              vectorColumnName: 'embedding',
              contentColumnName: 'content',
              metadataColumnName: 'metadata'
          }
      });
      return _storePersonal;
  } else {
      // Default: 'kb'
      if (_storeKB) return _storeKB;
      _storeKB = await PGVectorStore.initialize(embeddings, {
          postgresConnectionOptions: { connectionString },
          tableName: TABLE_NAME_KB,
          columns: {
              idColumnName: 'id',
              vectorColumnName: 'embedding',
              contentColumnName: 'content',
              metadataColumnName: 'metadata'
          }
      });
      return _storeKB;
  }
};

const similaritySearchRaw = async({user_id, query, topK = 6, pet_id=null, doc_types=[]})=>{
  if(!user_id || !query) return [];
  const embeddings = await getEmbeddings();
  const qvec = await embeddings.embedQuery(query);
  const qvecText = `[${qvec.join(',')}]`;

  const db = new DB_Connection();
  
  // --- QUERY 1: Personalized Data (User Chats, Health Records) from PERSONAL TABLE ---
  let paramsUser = [qvecText, String(user_id)];
  let filtersUser = [`(metadata->>'user_id') = $2`];
  let iUser = 3;
  // console.log(paramsUser);

  if(pet_id != null){
    filtersUser.push(`((metadata->>'pet_id') IS NULL OR (metadata->>'pet_id') = $${iUser})`);
    paramsUser.push(String(pet_id));
    iUser++;
  }

  if(Array.isArray(doc_types) && doc_types.length){
    const placeholders = doc_types.map(()=> `$${iUser++}`).join(', ');
    filtersUser.push(`(metadata->>'doc_type') IN (${placeholders})`);
    paramsUser.push(...doc_types.map(String));
  }

  const sqlUser = `
    SELECT id, content, metadata, (1 - (embedding <=> $1::vector)) AS score
    FROM ${TABLE_NAME_PERSONAL}
    WHERE ${filtersUser.join(' AND ')}
    ORDER BY embedding <=> $1::vector ASC
    LIMIT ${topK};
  `;

  // --- QUERY 2: Knowledge Base (Global Guidelines) from KB TABLE ---
  let paramsKB = [qvecText];
  let filtersKB = [`(metadata->>'user_id') = '0'`];
  let iKB = 2;

  if(Array.isArray(doc_types) && doc_types.length){
    const placeholders = doc_types.map(()=> `$${iKB++}`).join(', ');
    filtersKB.push(`(metadata->>'doc_type') IN (${placeholders})`);
    paramsKB.push(...doc_types.map(String));
  }

  const sqlKB = `
    SELECT id, content, metadata, (1 - (embedding <=> $1::vector)) AS score
    FROM ${TABLE_NAME_KB}
    WHERE ${filtersKB.join(' AND ')}
    ORDER BY embedding <=> $1::vector ASC
    LIMIT ${topK};
  `;

  const [resUser, resKB] = await Promise.all([
    db.query_executor(sqlUser, paramsUser).catch(e => { console.error("RAG User Search Error:", e); return {rows:[]}; }),
    db.query_executor(sqlKB, paramsKB).catch(e => { console.error("RAG KB Search Error:", e); return {rows:[]}; })
  ]);

  const userDocs = (resUser?.rows || []).map(x => ({
    id: x.id,
    content: x.content,
    metadata: x.metadata,
    score: Number(x.score)
  }));

  const knowledgeBaseDocs = (resKB?.rows || []).map(x => ({
    id: x.id,
    content: x.content,
    metadata: x.metadata,
    score: Number(x.score)
  }));
  
  console.log(`RAG Retrieval: ${userDocs.length} User docs, ${knowledgeBaseDocs.length} KB docs`);

  const result = [];
  
  if (userDocs.length > 0) {
    // Allocation: 60% User / 40% KB
    // Logic: Fill user slots first. Then fill KB slots. Then fill remaining with whatever is best (or just KB).
    const userSlots = Math.ceil(topK * 0.6); // e.g. 4
    const kbSlots = topK - userSlots;        // e.g. 2
    
    // Add User Docs (up to userSlots)
    const takenUserDocs = userDocs.slice(0, userSlots);
    result.push(...takenUserDocs);
    
    // Add KB Docs (up to kbSlots)
    const takenKBDocs = knowledgeBaseDocs.slice(0, kbSlots);
    result.push(...takenKBDocs);
    
    // Backfill if we are under topK specific limit
    if (result.length < topK) {
        // Try to add more KB docs first (usually higher quality text)
        const remainingSlots = topK - result.length;
        const moreKB = knowledgeBaseDocs.slice(kbSlots, kbSlots + remainingSlots);
        result.push(...moreKB);
    }
    
    if (result.length < topK) {
        // Try to add more User docs if still space
        const remainingSlots = topK - result.length;
        // We already took 'takenUserDocs.length'.
        const moreUser = userDocs.slice(takenUserDocs.length, takenUserDocs.length + remainingSlots);
        result.push(...moreUser);
    }
    
  } else {
    // No user docs - return only KB docs
    result.push(...knowledgeBaseDocs.slice(0, topK));
  }

  return result.slice(0, topK);
}

module.exports = { getVectorStore, similaritySearchRaw, TABLE_NAME_KB, TABLE_NAME_PERSONAL };
