let _embeddings = null;
const {OpenAIEmbeddings} = require('@langchain/openai');

const getEmbeddings = async ()=>{
    if(_embeddings) return _embeddings;
    _embeddings = new OpenAIEmbeddings({
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
    });
    return _embeddings;
}

module.exports = {getEmbeddings};
