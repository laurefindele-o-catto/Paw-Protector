# Controllers

Express request handlers live here. They receive HTTP requests, validate the input, call models/services, and shape the response. Keep them skinny and readable.

What each file does
- `userController.js`: Profile basics (get/update), subscription changes, avatar upload (via Cloudinary), and saved locations. Also returns roles on profile update so the client stays in sync.
- `petController.js`: Add/list/update pets, record health metrics, upload pet avatars, and generate a short pet summary for the UI.
- `chatController.js`: Chat sessions/messages, plus the agent endpoint (`POST /chat/agent`) that accepts text and an optional image. If an image is sent, it’s analyzed in the same turn and the finding is included in the reply. Also includes simple RAG upsert/search endpoints for custom knowledge.
- `careController.js`: Weekly care plan generation with a “fresh metrics within 7 days” guard. Produces a 7‑day plan and a human‑friendly summary, ensures daily reminders, and upserts care docs to the vector store for better follow‑ups.
- `diseaseController.js`: CRUD helpers for pet diseases (active and historical views).
- `emergencyController.js`: Create and list emergency requests for the current user.
- `anomalyController.js`: Accepts an image upload and tracks anomaly detection results for later reference.
- `clinicVetController.js`: Create clinics, create/update vet profiles, add reviews, and make appointments.
- `tableCreation.js`: Development helper to initialize DB tables from code (no migration tool yet). Use with care.

Conventions
- Do minimal data shaping here; heavy lifting belongs in `models/` and `rag/`.
- Always rely on `authenticateToken` to populate `req.user` for protected routes.
- Status codes: 201 for new resources, 200 for reads/updates, 204 for deletions.

Extending
- Add a controller method and wire it in `src/routes/*Routes.js`.
- If agents/RAG are involved, add a tool or helper under `src/rag/` and keep the controller simple.
