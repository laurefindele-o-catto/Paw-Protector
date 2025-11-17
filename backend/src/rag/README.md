# RAG & Agents

Agents, their tools, and the vector store live here. If the app “reasons” about something, it probably passes through this folder.

Files
- `agentGraph.js`: Defines two main agents—chat and care. The chat agent handles general Q&A + image evidence in one turn. The care agent produces weekly plans/summaries with a firm “metrics must be fresh” rule.
- `tools.js`: Small, dependable functions the agents can call: pet card, weekly health metrics, health records, nearby vets, and semantic RAG search.
- `service.js`: Utilities to upsert documents into the vector store and to run searches. Keeps `doc_type` consistent (e.g., `care_plan`, `care_summary`, `vision`).
- `embeddings.js`: Text → vector embedding helpers.
- `vectorStore.js`: pgvector integration for storage and search.
- `agent.js`: Minor orchestration glue (sessions, state helpers).

Conventions
- Tools should be predictable (same input → same output). No sneaky DB writes here.
- Always set `doc_type` and any key metadata when upserting so later retrievals are clean.
- Prefer JSON‑only outputs from agents; validate before saving to DB.
