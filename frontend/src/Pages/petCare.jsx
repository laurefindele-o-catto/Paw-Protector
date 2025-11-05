// petCare.jsx — engaging flashcard UI for cat care (with auto-translate)
import React, { useState } from "react";
import { useAutoTranslate } from "react-autolocalise";
import { useNavigate } from "react-router-dom";

/**
 * This version focuses on *readability* and *delight*:
 * - Flashcards (horizontal scroll, no autoplay) for daily routine
 * - Compact life-stage cards
 * - Vaccine timeline as stepper chips
 * - Essentials as bite-size cards
 * - Toxic list as pill cloud
 * Keep/extend styles from your LandingPage palette (#edfdfd, #0f172a, #fdd142)
 */
export default function PetCare() {
  const { t: translate } = useAutoTranslate();
  const navigate = useNavigate();

  // toggle state
  const [useTranslation, setUseTranslation] = useState(true);

  // fallback translator
  const t = useTranslation && translate ? translate : (s) => s;

  const daily = [
    {
      title: "Morning",
      emoji: "🌅",
      points: [
        "Fresh water & bowls",
        "Breakfast portion",
        "Scoop litter",
        "5–10 min play (wand)",
      ],
    },
    {
      title: "Mid-day",
      emoji: "🧩",
      points: ["Puzzle feeder / foraging", "Window perch & toy rotation"],
    },
    {
      title: "Evening",
      emoji: "🌙",
      points: ["Dinner portion", "Brush coat & teeth", "Interactive play, wind-down"],
    },
  ];

  const lifeStages = [
    {
      label: "Kittens",
      range: "0–12 m",
      key: "3x meals → 2x; vaccine series; deworm",
      emoji: "🍼",
    },
    {
      label: "Adults",
      range: "1–10 y",
      key: "Annual vet; 2x meals; enrichment",
      emoji: "💪",
    },
    {
      label: "Seniors",
      range: "10+ y",
      key: "Vet every ~6 mo; comfort & ramps",
      emoji: "🧣",
    },
  ];

  const vaccineSteps = [
    { label: "6–8 wks", sub: "FVRCP #1" },
    { label: "10–12 wks", sub: "FVRCP #2" },
    { label: "14–16 (to 20) wks", sub: "FVRCP #3 + Rabies*" },
    { label: "6–12 mo", sub: "Boosters" },
    { label: "Adult", sub: "FVRCP ~q3y; Rabies per law" },
  ];

  const essentials = [
    { title: "Feeding", tip: "Kittens 3×→2×; Adults 2×", emoji: "🍽️" },
    { title: "Hydration", tip: "Fresh water / fountain", emoji: "💧" },
    { title: "Litter", tip: "+1 box rule, scoop daily", emoji: "🧼" },
    { title: "Play", tip: "2–3 short sessions/day", emoji: "🪶" },
    { title: "Dental", tip: "Brush daily or 3–4×/wk", emoji: "🪥" },
    { title: "Parasites", tip: "Deworm & preventives", emoji: "🪲" },
  ];

  const toxic = [
    "Chocolate",
    "Onion/Garlic",
    "Grapes/Raisins",
    "Xylitol",
    "Alcohol",
    "Caffeine",
    "Unbaked dough",
    "Lilies (very toxic)",
  ];

  return (
    <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden">
      {/* Background accents */}
      <div className="pointer-events-none absolute -top-28 -left-24 h-72 w-72 bg-[#fdd142]/50 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -bottom-32 right-12 h-64 w-64 border-[18px] border-[#fdd142]/20 rounded-full animate-[spin_28s_linear_infinite]" />
      
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pt-10">
        <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-lg p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 bg-[#0f172a] text-[#edfdfd] px-3 py-1 rounded-full text-xs font-semibold">
                <span>🐾 PawPal</span>
                <span className="h-1 w-1 rounded-full bg-[#fdd142]" />
                <span>{t("Cat Care")}</span>
              </span>
              <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
                {t("Easy, Vet-informed Care Cards")}
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl">
                {t(
                  "Skim-friendly flashcards you can follow daily. Details are simplified—ask your veterinarian for personal advice."
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="#daily"
                className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] text-[#edfdfd] px-5 py-3 font-semibold shadow hover:bg-slate-900 transition"
                aria-label={t("Start Daily Cards")}
              >
                {t("Start Daily Cards")}
              </a>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold shadow hover:shadow-md transition"
                aria-label={t("Print")}
              >
                {t("Print")}
              </button>
            </div>
          </div>
        </div>
      </section>
      <button
        onClick={() => navigate("/dashboard")}
        className="absolute top-6 left-6 flex items-center px-4 py-2 bg-black text-[#ffffff] rounded-lg shadow hover:bg-gray-700 transition z-20"
        aria-label="Back to dashboard"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t('Dashboard')}
      </button>

      {/* Translation toggle button */}
      <button
        onClick={() => setUseTranslation((prev) => !prev)}
        className="absolute top-6 right-6 px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-700 transition z-20"
        aria-label="Toggle language"
      >
        {useTranslation ? "BN" : "EN"}
      </button>

      {/* Daily flashcards */}
      <section id="daily" className="mx-auto max-w-6xl px-4 mt-8">
        <Header title="Daily Care Flashcards" subtitle="Swipe/scroll horizontally" t={t} />
        <div className="mt-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-4 min-w-max">
            {daily.map((card) => (
              <FlashCard key={card.title} title={card.title} emoji={card.emoji} points={card.points} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Life stage cards */}
      <section className="mx-auto max-w-6xl px-4 mt-10">
        <Header title="Life Stages" subtitle="Right care at the right time" t={t} />
        <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {lifeStages.map((s) => (
            <article
              key={s.label}
              className="group bg-white/90 border border-white rounded-2xl shadow p-5 hover:shadow-lg transition"
              aria-label={t("Life stage card")}
            >
              <div className="text-2xl">{s.emoji}</div>
              <h3 className="mt-2 font-bold text-lg">
                {t(s.label)} <span className="text-slate-500 font-normal">{s.range}</span>
              </h3>
              <p className="mt-1 text-sm text-slate-700">{t(s.key)}</p>
              <div className="mt-3 h-1 w-16 bg-[#fdd142] rounded-full group-hover:w-24 transition-all" />
            </article>
          ))}
        </div>
      </section>

      {/* Vaccine timeline */}
      <section className="mx-auto max-w-6xl px-4 mt-10">
        <Header
          title="Vaccine Timeline"
          subtitle="Condensed overview (ask your vet for exact plan)"
          t={t}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          {vaccineSteps.map((s, i) => (
            <span
              key={s.label}
              className="inline-flex flex-col items-start justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:shadow transition"
              aria-label={t("Vaccine step")}
            >
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {t("Step")} {i + 1}
              </span>
              <span className="font-semibold">{s.label}</span>
              <span className="text-xs text-slate-600">{t(s.sub)}</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {t(
            "* Rabies timing varies by jurisdiction; follow local law and your veterinarian’s advice."
          )}
        </p>
      </section>

      {/* Essentials grid */}
      <section className="mx-auto max-w-6xl px-4 mt-10">
        <Header title="Essentials" subtitle="Small habits, big impact" t={t} />
        <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {essentials.map((e) => (
            <article
              key={e.title}
              className="bg-white/90 border border-white rounded-2xl shadow p-5 hover:shadow-lg transition"
              aria-label={t("Essential card")}
            >
              <div className="text-2xl">{e.emoji}</div>
              <h3 className="mt-2 font-bold">{t(e.title)}</h3>
              <p className="text-sm text-slate-700 mt-1">{t(e.tip)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Toxic chips */}
      <section className="mx-auto max-w-6xl px-4 mt-10 mb-24">
        <Header title="Toxic to Cats" subtitle="Keep these away—seek help if exposed" t={t} />
        <div className="mt-3 flex flex-wrap gap-2" aria-label={t("Toxic items list")}>
          {toxic.map((tox) => (
            <span
              key={tox}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1 text-sm shadow-sm"
              aria-label={t("Toxic item")}
            >
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {t(tox)}
            </span>
          ))}
        </div>
        <a
          href="tel:+18884264435"
          className="inline-flex items-center gap-2 mt-4 rounded-full bg-[#0f172a] text-[#edfdfd] px-4 py-2 text-sm font-semibold shadow hover:bg-slate-900"
          aria-label={t("Call ASPCA Poison Control")}
        >
          {t("ASPCA Poison Control")} 888-426-4435
        </a>
        <p className="mt-3 text-xs text-slate-500">
          {t("This is a simplified guide. Your vet may tailor a different plan for your cat.")}
        </p>
      </section>

      {/* Local keyframes */}
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

function Header({ title, subtitle, t }) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">{t(title)}</h2>
        <p className="text-sm text-slate-600">{t(subtitle)}</p>
      </div>
      <div className="hidden md:block h-10 w-10 rounded-full bg-[#fdd142] opacity-70" />
    </div>
  );
}

function FlashCard({ title, emoji, points, t }) {
  return (
    <article
      className="snap-center shrink-0 w-[280px] sm:w-[320px] bg-white/95 border border-white rounded-3xl shadow p-5 hover:shadow-lg transition"
      aria-label={t("Daily card")}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{t(title)}</h3>
        <div className="text-2xl">{emoji}</div>
      </div>
      <ul className="mt-3 text-sm text-slate-700 space-y-2 list-disc pl-5">
        {points.map((p, i) => (
          <li key={i}>{t(p)}</li>
        ))}
      </ul>
    </article>
  );
}




// // petCare.jsx
// import React, { useMemo, useState } from "react";
// import { Link } from "react-router-dom";

// /**
//  * PetCare — professional, engaging care schedules for cats
//  * Styling follows the LandingPage/Dashboard palette (#edfdfd, #0f172a, #fdd142)
//  * All content is purely informational and not a substitute for veterinary advice.
//  */
// export default function PetCare() {
//   const [open, setOpen] = useState(null);

//   const lifeStage = useMemo(
//     () => [
//       {
//         title: "Kittens (0–12 months)",
//         bullets: [
//           "Vet exams monthly until the core vaccine series is complete.",
//           "Core vaccines: FVRCP (panleukopenia, herpesvirus-1, calicivirus) starting 6–8 weeks; boosters every 3–4 weeks until 16–20 weeks; booster again at ~6–12 months.",
//           "Rabies: once at ~12–16 weeks (follow local law); booster 1 year later.",
//           "Deworming: every 2 weeks from 2–8 weeks, then monthly until 6 months; fecal exam as advised.",
//           "Feed 3 meals/day to 6 months, then 2 meals/day to 12 months; use kitten-formulated food.",
//           "Daily social play (2–3 short sessions), gentle handling, and litter training support.",
//         ],
//       },
//       {
//         title: "Adults (1–10 years)",
//         bullets: [
//           "Comprehensive vet check at least annually (physical, weight, BCS/MCS, dental, parasite prevention).",
//           "Core vaccine boosters typically every 3 years after the 1-year booster (per vet assessment).",
//           "Year‑round parasite prevention as indicated by regional risk.",
//           "Twice‑daily feeding with portion control; maintain hydration and enrichment.",
//           "Daily tooth brushing (or 3–4×/week) and VOHC‑accepted dental adjuncts.",
//         ],
//       },
//       {
//         title: "Seniors (10+ years)",
//         bullets: [
//           "Vet visits every 6 months; closer monitoring for weight change, pain, cognition, and mobility.",
//           "Adjust diet (calories, protein, texture) per vet; maintain hydration and gentle play.",
//           "Increase home modifications: warm resting spots, easy litter access, ramps/steps, multiple resources.",
//         ],
//       },
//     ],
//     []
//   );

//   const vaccineTable = [
//     { stage: "Kitten 6–8 wks", core: "FVRCP #1", rabies: "—", notes: "Start series; exam & deworming." },
//     { stage: "10–12 wks", core: "FVRCP #2", rabies: "—", notes: "Booster 3–4 wks after prior." },
//     { stage: "14–16 (to 20) wks", core: "FVRCP #3 (final in series)", rabies: "Rabies (per law)", notes: "Last kitten booster when ≥16 wks." },
//     { stage: "6–12 months", core: "FVRCP booster", rabies: "Rabies booster", notes: "Then move to adult intervals as advised." },
//     { stage: "Adult", core: "FVRCP every ~3 yrs*", rabies: "Per label/law (often 1–3 yrs)", notes: "Frequency individualized by your vet." },
//   ];

//   const daily = [
//     { title: "Morning", items: ["Refresh water & bowls; check appetite.", "Feed scheduled meal; remove leftovers for portion control.", "Scoop litter; quick health scan (energy, gait, coat).", "5–10 min play (wand toy) to satisfy hunt–catch–kill–eat–groom–sleep cycle."] },
//     { title: "Mid‑day", items: ["Puzzle feeder or snuffle mat for mental work.", "Window perch / bird‑TV; rotate toys."] },
//     { title: "Evening", items: ["Second meal; update portions based on weight & BCS.", "Short grooming (comb/brush) and tooth brushing.", "Interactive play session; wind‑down routine."] },
//   ];

//   const weekly = [
//     "Weigh your cat; record BCS (1–9) and note trends.",
//     "Trim nails (about every 2–4 weeks; weekly check).",
//     "Full litter change/box wash (scoop daily).",
//     "Rotate toy set and add new scent/texture challenges.",
//   ];

//   const monthly = [
//     "Parasite prevention per vet (flea/tick/heartworm as regionally indicated).",
//     "Deep clean food/water stations; check fountain filter.",
//     "Home exam: ears, teeth/gums, coat, lumps, mobility." ,
//   ];

//   const quarterly = [
//     "Replace worn scratching posts or add vertical territory.",
//     "Audit calories/portions; update with your vet if weight changed.",
//   ];

//   const yearly = [
//     "Comprehensive wellness exam; labwork as advised (CBC/chem/UA).",
//     "Professional dental evaluation/cleaning under anesthesia as recommended.",
//     "Core/non‑core vaccine review and boosters per risk.",
//   ];

//   const toxicFoods = [
//     "Chocolate/cocoa",
//     "Onion/garlic/chives",
//     "Grapes/raisins",
//     "Alcohol",
//     "Xylitol (in sugar‑free products)",
//     "Caffeine/coffee",
//     "Unbaked bread dough (yeast)",
//     "Certain lilies (plant/pollen is highly toxic to cats)",
//   ];

//   return (
//     <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden">
//       {/* Background accents */}
//       <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 bg-[#fdd142]/50 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
//       <div className="pointer-events-none absolute -bottom-32 right-12 h-64 w-64 border-[18px] border-[#fdd142]/20 rounded-full animate-[spin_28s_linear_infinite]" />
//       <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 bg-gradient-to-tr from-[#fdd142]/30 to-transparent rounded-[42%] blur-2xl animate-[morph_14s_ease-in-out_infinite]" />

//       {/* Hero */}
//       <section className="relative mx-auto max-w-6xl px-4 pt-12">
//         <div className="bg-white/80 backdrop-blur-md border border-white rounded-3xl shadow-lg p-6 md:p-10">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
//             <div>
//               <div className="inline-flex items-center gap-2 bg-[#0f172a] text-[#edfdfd] px-3 py-1 rounded-full text-xs font-semibold">
//                 <span>🐾 PawPal</span>
//                 <span className="h-1 w-1 rounded-full bg-[#fdd142]"></span>
//                 <span>Cat Care Schedules</span>
//               </div>
//               <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
//                 Your Cat’s Daily‑to‑Yearly Care Plan
//               </h1>
//               <p className="mt-2 text-slate-600 max-w-2xl">
//                 Evidence‑informed routines you can print, share, and follow. Always personalize with your veterinarian.
//               </p>
//             </div>
//             <div className="flex items-center gap-3">
//               <a
//                 href="#vaccines"
//                 className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] text-[#edfdfd] px-5 py-3 font-semibold shadow hover:bg-slate-900 transition"
//               >
//                 View Vaccines
//               </a>
//               <button
//                 onClick={() => window.print()}
//                 className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold shadow hover:shadow-md transition"
//                 aria-label="Print this care plan"
//               >
//                 Print Plan
//               </button>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Life stage cards */}
//       <section className="mx-auto max-w-6xl px-4 mt-8 grid md:grid-cols-3 gap-4">
//         {lifeStage.map((col) => (
//           <article key={col.title} className="bg-white/85 backdrop-blur-md border border-white rounded-2xl shadow p-6">
//             <h3 className="font-bold text-lg">{col.title}</h3>
//             <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
//               {col.bullets.map((b, i) => (
//                 <li key={i}>{b}</li>
//               ))}
//             </ul>
//           </article>
//         ))}
//       </section>

//       {/* Daily / Weekly */}
//       <section className="mx-auto max-w-6xl px-4 mt-8 grid md:grid-cols-2 gap-4">
//         <article className="bg-white/85 backdrop-blur-md border border-white rounded-2xl shadow p-6">
//           <h3 className="font-bold text-xl">Daily routine</h3>
//           <div className="mt-3 grid gap-3">
//             {daily.map((b) => (
//               <div key={b.title} className="rounded-xl border border-slate-100 p-4">
//                 <h4 className="font-semibold">{b.title}</h4>
//                 <ul className="mt-2 text-sm text-slate-700 list-disc pl-5 space-y-1">
//                   {b.items.map((it, i) => (
//                     <li key={i}>{it}</li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>
//         </article>
//         <article className="bg-white/85 backdrop-blur-md border border-white rounded-2xl shadow p-6">
//           <h3 className="font-bold text-xl">Weekly checkpoints</h3>
//           <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
//             {weekly.map((b, i) => (
//               <li key={i}>{b}</li>
//             ))}
//           </ul>
//           <h3 className="mt-6 font-bold text-xl">Monthly / Quarterly / Yearly</h3>
//           <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
//             {monthly.map((b, i) => (
//               <li key={`m-${i}`}>{b}</li>
//             ))}
//             {quarterly.map((b, i) => (
//               <li key={`q-${i}`}>{b}</li>
//             ))}
//             {yearly.map((b, i) => (
//               <li key={`y-${i}`}>{b}</li>
//             ))}
//           </ul>
//         </article>
//       </section>

//       {/* Feeding */}
//       <section className="mx-auto max-w-6xl px-4 mt-8 grid md:grid-cols-2 gap-4">
//         <article className="bg-white/85 backdrop-blur-md border border-white rounded-2xl shadow p-6">
//           <h3 className="font-bold text-xl">Feeding schedule</h3>
//           <p className="mt-2 text-sm text-slate-700">
//             Kittens generally eat three meals/day until ~6 months, then transition to twice daily through 12 months. Adults commonly do well on two meals/day; adjust portions to maintain a lean, steady body condition.
//           </p>
//           <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
//             <div className="rounded-xl border p-4">
//               <h4 className="font-semibold">Kittens</h4>
//               <p>3 meals/day to 6 mo → 2 meals to 12 mo.</p>
//             </div>
//             <div className="rounded-xl border p-4">
//               <h4 className="font-semibold">Adults</h4>
//               <p>Typically 2 meals/day; portion by BCS.</p>
//             </div>
//             <div className="rounded-xl border p-4">
//               <h4 className="font-semibold">Hydration</h4>
//               <p>Offer fresh water; consider fountains and wet food for cats that drink little.</p>
//             </div>
//             <div className="rounded-xl border p-4">
//               <h4 className="font-semibold">Enrichment feeding</h4>
//               <p>Use puzzle feeders or scatter‑feeding to slow intake and add mental work.</p>
//             </div>
//           </div>
//         </article>
//         <article className="bg-white/85 backdrop-blur-md border border-white rounded-2xl shadow p-6">
//           <h3 className="font-bold text-xl">Litter & home environment</h3>
//           <ul className="mt-3 space-y-2 text-sm text-slate-700 list-disc pl-5">
//             <li>Provide multiple resources: feeding, water, resting, play/scratch, and litter in separate areas.</li>
//             <li>General rule: at least one litter box per cat plus one; scoop daily; wash boxes regularly.</li>
//             <li>Offer vertical spaces, hiding spots, and varied scratching surfaces (horizontal/vertical, different materials).</li>
//             <li>Plan 2–3 short interactive play sessions/day (5–10 minutes each).</li>
//           </ul>
//         </article>
//       </section>

//       {/* Vaccines */}
//       <section id="vaccines" className="mx-auto max-w-6xl px-4 mt-8">
//         <article className="bg-white/85 backdrop-blur-md border border-white rounded-2xl shadow p-6">
//           <div className="flex items-center justify-between gap-4 flex-wrap">
//             <h3 className="font-bold text-xl">Core vaccination timeline</h3>
//             <span className="text-[10px] bg-[#fdd142] text-black px-2 py-1 rounded-full">Vet‑tailored</span>
//           </div>
//           <div className="mt-4 overflow-x-auto">
//             <table className="min-w-full text-sm">
//               <thead>
//                 <tr className="text-left text-slate-500">
//                   <th className="py-2 pr-4">Age/Stage</th>
//                   <th className="py-2 pr-4">FVRCP</th>
//                   <th className="py-2 pr-4">Rabies</th>
//                   <th className="py-2 pr-4">Notes</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {vaccineTable.map((row) => (
//                   <tr key={row.stage} className="border-t border-slate-100">
//                     <td className="py-2 pr-4 font-medium">{row.stage}</td>
//                     <td className="py-2 pr-4">{row.core}</td>
//                     <td className="py-2 pr-4">{row.rabies}</td>
//                     <td className="py-2 pr-4 text-slate-700">{row.notes}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <p className="mt-3 text-xs text-slate-500">* Many vets boost core vaccines about every 3 years after the 1‑year booster; exact timing varies by product, law, and risk.</p>
//         </article>
//       </section>

//       {/* Parasites & dental (accordion) */}
//       <section className="mx-auto max-w-6xl px-4 mt-8 grid md:grid-cols-2 gap-4">
//         <article className="bg-white/85 backdrop-blur-md border border-white rounded-2xl shadow p-2">
//           <button className="w-full text-left p-4" onClick={() => setOpen(open === "parasites" ? null : "parasites") }>
//             <h3 className="font-bold text-xl">Parasite control & deworming</h3>
//             <p className="text-sm text-slate-600">Kittens: every 2 weeks from 2–8 wks; then monthly to 6 months. Adults: on a vet‑recommended schedule; routine fecal checks.</p>
//           </button>
//           <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open === "parasites" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
//             <div className="overflow-hidden px-4 pb-4 text-sm text-slate-700">
//               <ul className="list-disc pl-5 space-y-1">
//                 <li>Roundworms can affect people; promptly dispose of feces and wash hands.</li>
//                 <li>Use year‑round preventives as indicated for your region; indoor cats can still be exposed.</li>
//                 <li>Discuss tapeworm, hookworm, and heartworm prevention with your veterinarian.</li>
//               </ul>
//             </div>
//           </div>
//         </article>
//         <article className="bg-white/85 backdrop-blur-md border border-white rounded-2xl shadow p-2">
//           <button className="w-full text-left p-4" onClick={() => setOpen(open === "dental" ? null : "dental") }>
//             <h3 className="font-bold text-xl">Dental care</h3>
//             <p className="text-sm text-slate-600">Brush daily (or at least 3–4×/week) with pet toothpaste; schedule professional cleanings as your vet recommends.</p>
//           </button>
//           <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open === "dental" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
//             <div className="overflow-hidden px-4 pb-4 text-sm text-slate-700">
//               <ul className="list-disc pl-5 space-y-1">
//                 <li>Never use human toothpaste (fluoride/xylitol can be harmful).</li>
//                 <li>Look for VOHC‑accepted dental products as adjuncts.</li>
//                 <li>Professional cleanings are performed under anesthesia to assess and treat below the gumline.</li>
//               </ul>
//             </div>
//           </div>
//         </article>
//       </section>

//       {/* Toxic foods */}
//       <section className="mx-auto max-w-6xl px-4 mt-8">
//         <article className="bg-white/85 backdrop-blur-md border border-white rounded-2xl shadow p-6">
//           <div className="flex items-center justify-between gap-4 flex-wrap">
//             <h3 className="font-bold text-xl">Foods & plants to avoid</h3>
//             <a href="tel:+18884264435" className="text-xs rounded-full bg-[#0f172a] text-[#edfdfd] px-3 py-1">ASPCA Poison Control 888‑426‑4435</a>
//           </div>
//           <ul className="mt-3 grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm text-slate-700 list-disc pl-5">
//             {toxicFoods.map((t) => (
//               <li key={t}>{t}</li>
//             ))}
//           </ul>
//           <p className="mt-3 text-xs text-slate-500">If exposure is suspected, contact your veterinarian or poison control immediately; note what and how much was ingested.</p>
//         </article>
//       </section>

//       {/* Footer note */}
//       <section className="mx-auto max-w-6xl px-4 mt-8 mb-24">
//         <div className="bg-white/85 backdrop-blur-md border border-white rounded-2xl shadow p-5">
//           <p className="text-xs text-slate-600">
//             Disclaimer: schedules are generalized starting points based on veterinary guidelines. Your veterinarian may tailor different intervals or products for your cat’s health status and local risks.
//           </p>
//         </div>
//       </section>

//       {/* Keyframes */}
//       <style>{`
//         @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
//         @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
//         @keyframes morph { 0%{border-radius:40% 60% 50% 50%/50% 40% 60% 50%} 50%{border-radius:60% 40% 60% 40%/40% 60% 40% 60%} 100%{border-radius:40% 60% 50% 50%/50% 40% 60% 50%} }
//         @media print { a[href]:after{content:""} button{display:none} }
//       `}</style>
//     </div>
//   );
// }
