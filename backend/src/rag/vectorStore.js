const DB_Connection = require('../database/db.js');
const {getEmbeddings} = require('./embeddings.js');
const {PGVectorStore} = require('@langchain/community/vectorstores/pgvector');
const {Pool} = require('pg');
const path = require('path');
const dotenv = require('dotenv');

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

let _store = null;

const TABLE_NAME = process.env.RAG_TABLE_NAME || 'rag_documents_lc';

const getVectorStore = async()=>{
  if(_store) return _store;

  const embeddings = await getEmbeddings();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Missing DATABASE_URL');

  _store = await PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: { connectionString: process.env.DATABASE_URL },
    tableName: TABLE_NAME,
    
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'embedding',
      contentColumnName: 'content',
      metadataColumnName: 'metadata'
    }
  });

  return _store;
};

const similaritySearchRaw = async({user_id, query, topK = 6, pet_id=null, doc_types=[]})=>{
  if(!user_id || !query) return [];
  const embeddings = await getEmbeddings();
  const qvec = await embeddings.embedQuery(query);

  const qvecText = `[${qvec.join(',')}]`;

  const db = new DB_Connection();
  const filters = [`(metadata->>'user_id') = $2`];
  const params = [qvecText, String(user_id)];
  let i=3;

  if(pet_id != null){
    filters.push(`((metadata->>'pet_id') IS NULL OR (metadata->>'pet_id') = $${i})`);
    params.push(String(pet_id));
    i++;
  }

  if(Array.isArray(doc_types) && doc_types.length){
    const placeholders = doc_types.map(()=> `$${i++}`).join(', ');
    filters.push(`(metadata->>'doc_type') IN (${placeholders})`);
    params.push(...doc_types.map(String));
  }

  const sql = `
    SELECT id, content, metadata, (1 - (embedding <=> $1::vector)) AS score
    FROM ${TABLE_NAME}
    WHERE ${filters.join(' AND ')}
    ORDER BY embedding <=> $1::vector ASC
    LIMIT ${Number(topK) || 6};
  `;

  const r = await db.query_executor(sql, params);
  return (r?.rows || []).map(x => ({
    id: x.id,
    content: x.content,
    metadata: x.metadata,
    score: Number(x.score)
  }));
}

module.exports = { getVectorStore, similaritySearchRaw, TABLE_NAME };
