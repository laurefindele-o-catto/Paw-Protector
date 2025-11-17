# Database

PostgreSQL (Neon friendly). Thin wrapper to get a pooled client and a dev‑only initializer to create tables.

Files
- `db.js`: Builds a pooled client using `DATABASE_URL`. Shared by all models. If something goes wrong, it will surface here first.
- `../routes/tableCreation.js` + `../controllers/tableCreation.js`: Minimal “create tables if missing” endpoint for development. Helpful when you’re iterating quickly without a full migration tool.

Conventions
- Parameterized queries only—no string concatenation with user input.
- For health metrics, prefer the `measured_at` timestamp for recency checks.
- Keep schema changes inside `tableCreation.js` until a proper migration workflow is added.

Local setup
- Put DB credentials in `.env` (see `backend/src/.env.example`).
- Run the server and call `POST /api/init-tables` once to bootstrap tables in dev.
