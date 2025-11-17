# Docs

We ship OpenAPI 3 docs generated from in‑code JSDoc blocks. If you document a route, it shows up automatically in Swagger UI.

How to view
- Start the backend and open `/api/docs`. The raw JSON is at `/api/docs.json`.

Config
- `swaggerConfig.js`: Title/servers, JWT security scheme, tags, and shared schemas (e.g., `User`, `Pet`, `CarePlan`).
- Scans: `src/routes/*.js` and `src/controllers/*.js` for `@openapi` blocks.

Writing good docs
- Put `@openapi` blocks directly above the route. Keep the summary short and clear.
- Document path params, query params, and requestBody with minimal but correct schemas.
- Reuse shared schemas from `components.schemas` in `swaggerConfig.js` to keep things consistent.
