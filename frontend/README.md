# Paw Protector — Frontend (React + Vite)

An AI-driven pet health companion focused on Bangladesh. This frontend hosts:
- Symptom triage chat (RAG-backed)
- Vision scan (basic anomaly detection from images)
- Vet finder (map + reviews)
- Smart reminders (vaccines, deworming)
- Basic care guides (feeding, litter training)

Tech: React + Vite, ESLint, modular feature-first structure.

---

## Quick Start (Windows)

Prerequisites
- Node.js 18+: https://nodejs.org
- npm (comes with Node) 

Setup
1) Open VS Code in the repo and terminal in this folder:
   cd "d:\My Workspace\Hackathons\Paw_Protector\frontend" or if the "Paw Protector" is open, just cd frontend.

2) Install deps:
   ```
   npm install
    ```

3) Create an .env file (do not commit secrets):
   - See .env.example for which variables are present currently.

4) Run dev server:
   ```npm run dev```
   - App: http://localhost:5173

Build and preview
- Build: ```npm run build``` (not necessary now)
- Preview production build: npm run preview


Port busy? Run: ```npm run dev -- --port 5174```

---

Guidelines
- components/: Generic, reusable components (like custom Buttons, Forms).
- features/: UI + hooks specific to the domain (Chat, vets, vision-ocr models).
- pages/: Top-level routes (e.g., HomePage, ChatPage, VisionScanPage, VetsPage). Pages compose features and wire navigation.
- services/: All network and third-party integrations. Keep fetch/axios here; return clean, parsed data. Read base URLs from env.

---

## How to Add Something

Add a new page (e.g., “Adoption”)
1) Create src/pages/AdoptionPage.jsx
2) Create a feature if needed: src/features/adoption/...
3) Register a route in App.jsx and link it in the nav.

Add an API call
1) Add function in src/services/something.js
2) Use it inside a feature hook (src/features/<domain>/hooks/useXyz.js)
3) Render results in feature components, used by a page.

Add UI components shared by multiple features
- Put them in src/components (e.g., Spinner, EmptyState, SectionHeader)

Vision feature tips
- Upload images via Cloudinary (client-side unsigned preset) or your backend signer.
- Keep inference calls server-side when possible; the frontend only sends references.

---


## Project Snapshot

- Core: AI triage chat, anomaly hints from images, vet finder, reminders, care guides.
- Initial users: Bangladeshi pet owners (cats/dogs), mobile-first.
- Safety: Guidance is suggestions, not medical diagnosis; encourages licensed vet visits.

Team (Mashed Potatoes)
- Epshita Jahan — BUET
- Pritom Biswas — BUET
- Rubaiyat Zaman Raisa — BUET
- Khandoker Md Tanjinul Islam — BUET
```// filepath: d:\My Workspace\Hackathons\Paw_Protector\frontend\README.md
# Paw Protector — Frontend (React + Vite)

An AI-driven pet health companion focused on Bangladesh. This frontend hosts:
- Symptom triage chat (RAG-backed)
- Vision scan (basic anomaly detection from images)
- Vet finder (map + reviews)
- Smart reminders (vaccines, deworming)
- Basic care guides (feeding, litter training)

Tech: React + Vite, ESLint, modular feature-first structure.

---

