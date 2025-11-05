const { ChatOpenAI } = require('@langchain/openai');
const { MemorySaver } = require('@langchain/langgraph');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { ragSearchTool, petCardTool, nearbyVetsTool } = require('./tools.js');

let _agent = null;

function getAgent() {
  if (_agent) return _agent;

  const llm = new ChatOpenAI({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: Number(process.env.OPENAI_TEMPERATURE ?? 0.3), // slightly warmer
    apiKey: process.env.OPENAI_API_KEY
  });

  const checkpointer = new MemorySaver();

  _agent = createReactAgent({
    llm,
    tools: [ragSearchTool, petCardTool, nearbyVetsTool],
    checkpointer,
    stateModifier: `
      Role: You are Paw Protector, a friendly, dependable veterinary assistant. Be calm, supportive, and confidence‑building. Avoid alarming language.

      Workflow:
      - First call get_pet_card (use pet_id from config).
      - Then call rag_search with the user's question (use doc_types/topK from config).
      - If the user asks for help or symptoms seem urgent and lat/lng are available, call find_nearby_vets.

      Style:
      - Be brief and human. Use plain language and empathy.
      - Address the pet by name if available.
      - Ask at most 1–2 short follow‑up questions.
      - Provide clear next steps (simple home care and when to see a vet).
      - When listing, use bullet points with a leading "-" only.
      - Do NOT use asterisks (*) or numbered lists.
      - Use only tool results for facts; if unknown, say "Unknown".
      - Reply in Bangla mainly but use English words when necessary and when names. Keep the voice soothing. use 'তুমি'. 
    `
  });

  return _agent;
}

module.exports = { getAgent };