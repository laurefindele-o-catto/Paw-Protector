# Paw Protector Frontend (React + Vite)

AI-assisted pet health companion (Bangladesh focus). Features:
- RAG-backed chat & care summaries
- Vision skin anomaly hinting
- Vet finder (maps + distance)
- Vaccination & deworming alerts
- Pet profile (data improves retrieval quality)

## Stack
React 18, Vite, TailwindCSS, Socket.io (client), Cloudinary (images), i18n (AutoLocalise), OpenAI (via backend), ESLint.

## Environment
Create `.env` (see `.env.example`):
```
VITE_GOOGLE_MAPS_API_KEY=...
VITE_AUTO_LOCALISE_KEY=...
```
Restart dev server after edits.

## Scripts
```
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Structure (high level)
- src/pages/: Route-level screens
- src/components/: Reusable UI blocks
- src/features/: Domain bundles (chat, pet profile, vets, vision)
- src/context/: Auth & pet selection
- src/config/: API base config
- src/services/: Network logic (centralize fetch)
- src/hooks/: Generic custom hooks
- src/assets/: Static images/icons

## Patterns
- Fetch calls return parsed JSON; errors handled gracefully.
- Env access: `import.meta.env.VITE_*`.
- Maps guarded: if key missing, show fallback message.
- Chat sanitization strips markdown for Bengali UX.

## Adding A Page
1. Create `src/pages/NewPage.jsx`
2. Add route in `App.jsx`
3. Link from Header/Nav.

## Image Uploads
Use backend -> Cloudinary (signed) or unsigned preset (if configured). Returned URL stored with pet/user.

## Localization
Toggle BN/EN in UI. Raw text wrapped with `t()` where dynamic.

## Safety Note
Results and suggestions are not medical advice. Always involve a vet.

Happy building.

