# Models

This is the DB layer. Models hide SQL details and return plain JavaScript objects that controllers can send to clients.

Main files
- `userModel.js`: Users, credentials metadata, refresh tokens, and profile fields.
- `petModel.js`: Pets CRUD and health metrics (weight, temperature, etc.).
- `careModel.js`: Store and fetch weekly care plans and summaries; also includes the “last metric updated” checks used by the freshness guard.
- `clinicVetModel.js`: Clinics, vets, and the relationships between them (plus ratings and appointments).
- `diseaseModel.js`: Add/update/remove diseases, and quick filters for active vs archived.
- `emergencyModel.js`: Persist user emergency requests.
- `chatModel.js`: Chat sessions and messages store.
- `anomalyModel.js`: Store anomaly job references and results.

Conventions
- Only SQL and mapping here—no Express, no status codes.
- Use parameterized queries; never build SQL strings directly from user input.
- Keep methods small and purposeful (e.g., `getById`, `listForPet(petId)`).
