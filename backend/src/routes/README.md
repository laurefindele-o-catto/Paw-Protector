# Routes

All the API endpoints are defined here, grouped by feature domain.

Files & what they cover
- `authRoutes.js` + `userRoutes.js`: Sign up/in, tokens, email flows, profile updates, subscription changes, avatar upload, locations.
- `chatRoutes.js`: Chat sessions/messages and the single agent endpoint that accepts text + optional image (same turn analysis). Also RAG upsert/search for custom knowledge.
- `careRoutes.js`: Generate weekly plans (freshness guard), fetch plan/summary, and list/add vaccinations/dewormings.
- `petRoutes.js`: Create/update pets, record health metrics, and upload pet avatars.
- `clinicVetRoutes.js`: Create clinics, add/update vet profiles, submit reviews, and book appointments.
- `diseaseRoutes.js`: Disease CRUD and filtered lists.
- `emergencyRoutes.js`: Create and view emergency requests.
- `anomalyRoutes.js`: Upload media for anomaly detection and store results.
- `tableCreation.js`: Dev‑only endpoint to initialize core tables.

Conventions
- Base path is `/api` (see `src/index.js`).
- Every route should have an `@openapi` JSDoc block so it shows up in Swagger.
- If you add a new route that needs shared schemas, update `docs/swaggerConfig.js` once and reuse those schemas everywhere.
