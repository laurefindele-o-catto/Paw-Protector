# PawPal Backend 

A focused Node.js backend for auth, pet care, RAG, and realtime updates. This file is intentionally brief. For hands‑on usage, open the README in each folder listed below.

## Stack
- Node.js + Express
- PostgreSQL (pg) with parameterized queries
- JWT (access/refresh), bcrypt
- Mailtrap (transactional email)
- Cloudinary (image storage)
- Socket.io (realtime)
- Swagger (OpenAPI docs)
- Helmet, CORS, rate limiting, morgan
- OpenAI + pgvector (RAG/embeddings)

## Core Flows (high level)

- Auth flow
  - Register → optional email verify → login → access/refresh tokens
  - Refresh token stored server‑side; access token in Authorization header
  - Password reset via email token

- Care & RAG flow
  - Pet health data → controllers call agents/tools → vector search/enrichment
  - Weekly care plan and summaries generated with guardrails (fresh metrics)

- Upload flow
  - Memory upload → Cloudinary transform → store hosted URL in DB

- Notifications & Realtime
  - Controllers emit events → notification service → Socket.io to user rooms

- API Docs
  - Swagger UI served from /api/docs with tags and shared schemas

## Folders (read these)

- controllers/ — Request handlers and orchestration  
  See ```controllers/README.md``` better understanding

- database/ — DB client and connection notes  
  See ```database/README.md```

- docs/ — Swagger config and authoring tips  
  See ```docs/README.md```

- events/ — Event bus and event name conventions  
  See ```events/README.md```

- middlewares/ — Auth and request middleware  
  See ```middlewares/README.md```

- models/ — SQL access and data mappers  
  See ```models/README.md```

- notifications/ — Outbound notifications (email/push/socket hooks)  
  See ```notifications/README.md```

- rag/ — Agents, tools, embeddings, vector store  
  See ```rag/README.md```

- realtime/ — Socket.io server and room patterns  
  See ```realtime/README.md```

- routes/ — Express routers with Swagger JSDoc blocks  
  See ```routes/README.md```

- utils/ — Cloudinary, email helpers, shared utilities  
  See ```utils/README.md```

## Environment
Copy src/.env.example to src/.env and fill values. Each folder README calls out the env it needs (e.g., Cloudinary, Mailtrap, JWT).

## Docs
Open /api/docs for Swagger UI. For request/response shapes, refer to the tags and schemas defined there.

