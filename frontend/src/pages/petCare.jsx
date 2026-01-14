// petCare.jsx — engaging flashcard UI for cat care (with auto-translate)
import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import apiConfig from "../config/apiConfig";
import Header from '../components/Header'
import { usePet } from "../context/PetContext";
import { useAuth } from "../context/AuthContext";

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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentPet, currentPetSummary } = usePet();
  const { user } = useAuth();
  const [printMode, setPrintMode] = useState('none'); // 'none', 'owner', 'vet'

  useEffect(() => {
    if (printMode !== 'none') {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printMode]);

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

  const dailyFallback = [
    {
      title: "Morning",
      emoji: "🌅",
      points: [
        "Fresh water & breakfast portioned",
        "Quick body/skin check",
        "Litter scoop or short walk",
      ],
    },
    {
      title: "Mid-day",
      emoji: "🧩",
      points: [
        "Interactive play 10–15 মিনিট",
        "Hydration reminder",
        "Grooming brush if needed",
      ],
    },
    {
      title: "Evening",
      emoji: "🌙",
      points: [
        "Dinner portioned",
        "Dental chew/brush",
        "Calm bonding or gentle massage",
      ],
    },
  ];

  // Weekly care summary/plan state (pet-specific)
  const [summary, setSummary] = useState(null);
  const [plan, setPlan] = useState(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vaxSteps, setVaxSteps] = useState(null);
  const [lifeStageData, setLifeStageData] = useState(null);
  const [stageSummary, setStageSummary] = useState(null);
  const [vaxNote, setVaxNote] = useState(null);

  // Personalized Essentials/Toxic
  const [essentialsP, setEssentialsP] = useState(null);
  const [toxicP, setToxicP] = useState(null);
  const [toxicTopNote, setToxicTopNote] = useState(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const petId = typeof window !== "undefined"
    ? Number(localStorage.getItem("current_pet_id") || localStorage.getItem("selected_pet_id") || "")
    : null;

  const saveSummaryLS = (pid, data) => {
    try { localStorage.setItem(`care_summary_${pid}`, JSON.stringify(data)); } catch {}
  };
  const loadSummaryLS = (pid) => {
    try {
      const raw = localStorage.getItem(`care_summary_${pid}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };
  const savePlanLS = (pid, week_start, planData) => {
    try {
      localStorage.setItem(`care_plan_${pid}_${week_start}`, JSON.stringify(planData));
      localStorage.setItem(`care_plan_current_${pid}`, JSON.stringify({ week_start, plan: planData }));
    } catch {}
  };
  const loadPlanCurrentLS = (pid) => {
    try {
      const raw = localStorage.getItem(`care_plan_current_${pid}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  useEffect(() => {
    let ignore = false;
    if (petId) {
      const localSummary = loadSummaryLS(petId);
      if (localSummary && !ignore) setSummary(localSummary);
      const localPlan = loadPlanCurrentLS(petId);
      if (localPlan?.plan && !ignore) {
        setPlan(localPlan.plan);
        setDayIndex(0);
      }
    }
    async function loadCare() {
      if (!token || !petId) return;
      setLoading(true);
      setError(null);
      try {
        const summaryRes = await fetch(`${apiConfig.baseURL}/api/care/summary?pet_id=${petId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (summaryRes.ok) {
          const summaryJson = await summaryRes.json();
          if (!ignore) {
            setSummary(summaryJson.summary || null);
            if (summaryJson.summary) saveSummaryLS(petId, summaryJson.summary);
          }
        }
        const planRes = await fetch(`${apiConfig.baseURL}/api/care/plan?pet_id=${petId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (planRes.status === 404) {
          if (!ignore) setPlan(null);
        } else if (planRes.status === 412) {
          const j = await planRes.json().catch(() => ({}));
          if (!ignore) setError(j?.message_bn || "Weekly metrics not updated.");
        } else if (planRes.ok) {
          const planJson = await planRes.json();
          if (!ignore) {
            setPlan(planJson.plan || null);
            setDayIndex(0);
            if (planJson.plan && planJson.week_start) savePlanLS(petId, planJson.week_start, planJson.plan);
          }
        } else if (!ignore) {
          setError("Could not load care plan.");
        }
      } catch {
        if (!ignore) setError("Network error while loading care plan.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadCare();
    try {
      const raw = localStorage.getItem(`care_summary_${localStorage.getItem('current_pet_id')}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!ignore && parsed && typeof parsed === 'object') setSummary(parsed);
      }
    } catch {}
    return () => { ignore = true; };
  }, [token, petId]);

  useEffect(() => {
    let ignore = false;
    async function loadPersonalized() {
      if (!token || !petId) return;
      try {
        const vRes = await fetch(`${apiConfig.baseURL}${apiConfig.care.vaccineTimeline(petId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (vRes.ok) {
          const vJson = await vRes.json();
          if (!ignore && vJson.success) {
            setVaxSteps(vJson.steps);
            setVaxNote(vJson.note || null);
          }
        }
      } catch {}
      try {
        const sRes = await fetch(`${apiConfig.baseURL}${apiConfig.care.lifeStages(petId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sRes.ok) {
          const sJson = await sRes.json();
          if (!ignore && sJson.success) {
            setLifeStageData(sJson.stages);
            setStageSummary(sJson.summary || null);
          }
        }
      } catch {}
    }
    loadPersonalized();
    return () => { ignore = true; };
  }, [token, petId]);

  const handleGenerate = async () => {
    if (!token || !petId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiConfig.baseURL}/api/care/plan/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ pet_id: petId })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 412) {
        setError(data?.message_bn || "Weekly metrics not updated. Update metrics to create cards.");
        return;
      }
      if (!res.ok) {
        setError(data?.error || "Failed to generate flashcards.");
        return;
      }
      if (data.summary) {
        setSummary(data.summary);
        saveSummaryLS(petId, data.summary);
      }
      if (data.plan) {
        setPlan(data.plan);
        setDayIndex(0);
      }
      if (data.plan && data.week_start) {
        savePlanLS(petId, data.week_start, data.plan);
      }
      const anchor = document.getElementById("daily");
      if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError("Network error while generating flashcards.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: build age in months
  const ageInMonths = (iso) => {
    if (!iso) return null;
    const b = new Date(iso);
    if (Number.isNaN(b.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - b.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
  };

  // Build personalized Essentials and Toxic lists
  function personalizeEssentialsAndToxic(pSum) {
    if (!pSum || !pSum.pet) return { e: null, tox: null, note: null };
    const months = ageInMonths(pSum.pet.birthdate);
    const active = (pSum.diseases?.active || []).map(d => String(d.disease_name || '').toLowerCase());
    const hasFeverVomiting = active.some(n => /fever|flu|vomit|gastro|diarrh/.test(n));
    const isKitten = months != null && months <= 12;
    const isSenior = months != null && months >= 120;

    // Essentials: start from base, tweak labels/tips and priority
    const e = [
      { title: "Hydration", tip: hasFeverVomiting ? "Fresh water in 2–3 spots + wet food; monitor intake" : "Fresh water / fountain", emoji: "💧" },
      { title: "Feeding", tip: isKitten ? "Kittens 3×→2×; wet+dry balanced" : (isSenior ? "Adults/Seniors 2×; easy-to-chew; portion control" : "Adults 2×; portion control"), emoji: "🍽️" },
      { title: "Litter", tip: "+1 box rule, scoop daily", emoji: "🧼" },
      { title: "Play", tip: "2–3 short sessions/day", emoji: "🪶" },
      { title: "Dental", tip: isSenior ? "Brush 3–4×/wk; soft chew; vet check if tartar" : "Brush daily or 3–4×/wk", emoji: "🪥" },
      { title: "Parasites", tip: "Cat‑safe preventives only; deworm as scheduled", emoji: "🪲" }
    ];
    // Toxic: keep base + highlight high‑risk items first
    const toxBase = [
      "Lilies (very toxic)", "Chocolate", "Onion/Garlic", "Grapes/Raisins", "Xylitol", "Alcohol", "Caffeine", "Unbaked dough"
    ];
    const extras = [
      "Human painkillers (paracetamol/ibuprofen)",
      "Essential oils (tea tree, eucalyptus)",
      "Permethrin (dog spot‑ons) — toxic to cats"
    ];
    const tox = Array.from(new Set([ ...extras.slice(0, 1), ...toxBase, ...extras.slice(1) ]));
    const note = hasFeverVomiting ? "Hydration first this week — avoid new treats; no human meds." : null;

    return { e, tox, note };
  }

  // Fetch pet summary once and personalize
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!token || !petId) return;
      try {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.pets.summary(petId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const pSum = data?.summary || null;
        if (!ignore && pSum) {
          const { e, tox, note } = personalizeEssentialsAndToxic(pSum);
          setEssentialsP(e);
          setToxicP(tox);
          setToxicTopNote(note);
        }
      } catch {}
    })();
    return () => { ignore = true; };
  }, [token, petId]);

  return (
    <>
      <Header/>
      <main id="main-content" role="main" tabIndex="-1">
      <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden mt-28">
        {/* Background accents */}
        <div className="pointer-events-none absolute -top-28 -left-24 h-72 w-72 bg-[#fdd142]/50 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -bottom-32 right-12 h-64 w-64 border-18 border-[#fdd142]/20 rounded-full animate-[spin_28s_linear_infinite]" />
        
        {/* Hero */}
        <section className="relative mx-auto max-w-6xl px-4 pt-10">
          <div className="bg-white/50 backdrop-blur-md border border-white rounded-3xl shadow-lg p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-2 bg-[#0f172a] text-[#edfdfd] px-3 py-1 rounded-full text-xs font-semibold">
                  <span>🐾 PawPal</span>
                  <span className="h-1 w-1 rounded-full bg-[#fdd142]" />
                  <span>{t("Cat Care")}</span>
                </span>
                <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
                  {t("Summary: ")}
                </h1>
                <p className="mt-2 text-slate-600 max-w-2xl">
                  {summary && typeof summary === 'object'
                    ? `${summary.current_status_bn || ''}${summary.trend_bn ? ` (${summary.trend_bn})` : ''}`
                    : t("Skim-friendly flashcards you can follow daily. Details are simplified—ask your veterinarian for personal advice.")
                  }
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !petId}
                  className={`inline-flex items-center gap-2 rounded-full ${loading ? "bg-slate-400" : "bg-[#0f172a] hover:bg-slate-900"} text-[#edfdfd] px-5 py-3 font-semibold shadow transition`}
                  aria-label={t("Generate Flashcards")}
                  title={!petId ? t("Select a pet first") : t("Generate this week's plan")}
                >
                  {loading ? t("Generating…") : t("Generate Flashcards")}
                </button>
                <div className="relative group">
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold shadow hover:shadow-md transition"
                    aria-label={t("Print Options")}
                  >
                    {t("Print / Export")}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 hidden group-hover:block z-50">
                     <button onClick={() => setPrintMode('owner')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 rounded-t-md">
                       {t("Daily Checklist (For Me)")}
                     </button>
                     <button onClick={() => setPrintMode('vet')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 rounded-b-md">
                       {t("Health Report (For Vet)")}
                     </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Health Snapshot Section */}
        {currentPetSummary && (
           <HealthSnapshot summary={currentPetSummary} t={t} />
        )}

        {/* Daily flashcards */}
        <section id="daily" className="mx-auto max-w-6xl px-4 mt-8">
          <TitleBar title={t("Daily Care Flashcards")} subtitle={t("This week's plan (toggle days)")} t={t} />

          {/* Day-specific reminders */}
          <div className="grid grid-cols-2 gap-4">
            {plan?.days && plan?.days[dayIndex]?.reminders?.length ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 h-full">
                <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  আজকের গুরুত্বপূর্ণ নোটিস
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                  {plan?.days[dayIndex].reminders.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : <div />}

            {plan?.global_reminders?.length ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/70 p-4 h-full">
                <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <span className="text-lg">🛑</span>
                  এই সপ্তাহের সতর্কতাসূচক নোট
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
                  {plan?.global_reminders.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : <div />}
          </div>
          {/* Day toggler (7 days) */}
          <div className="mt-3 flex flex-wrap gap-2 mt-12">
            {(plan?.days || []).map((d, i) => (
              <button
                key={d.date || i}
                onClick={() => setDayIndex(i)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  i === dayIndex ? "bg-[#0f172a] text-white border-[#0f172a]" : "bg-white border-slate-200 text-slate-800"
                }`}
                aria-label={`Day ${i + 1}`}
              >
                {new Date(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </button>
            ))}
          </div>

          
              
          {plan?.days?.length ? (
            <>
              <div className="mt-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-4 min-w-max">
                  <FlashCard title="Morning" emoji="🌅" points={plan?.days[dayIndex]?.morning || []} t={t} />
                  <FlashCard title="Mid-day" emoji="🧩" points={plan?.days[dayIndex]?.midday || []} t={t} />
                  <FlashCard title="Evening" emoji="🌙" points={plan?.days[dayIndex]?.evening || []} t={t} />
                </div>
              </div>

              
            </>
          ) : (
            <div className="mt-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-4 min-w-max">
                {dailyFallback.map((card) => (
                  <FlashCard key={card.title} title={card.title} emoji={card.emoji} points={card.points} t={t} />
                ))}
              </div>
              {!loading && !error && (
                <p className="mt-3 text-xs text-slate-500">
                  {t("Showing default tips. Update weekly metrics and generate a plan to see personalized cards.")}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Vaccine timeline */}
        <section className="mx-auto max-w-6xl px-4 mt-10">
          <TitleBar
            title={t("Vaccine Timeline")}
            subtitle={t("Condensed overview (ask your vet for exact plan)")}
            t={t}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {(vaxSteps || vaccineSteps).map((s, i) => {
              const status = s.status || 'static';
              const color =
                status === 'completed' ? 'border-emerald-300 bg-emerald-50'
                : status === 'overdue' ? 'border-red-300 bg-red-50'
                : status === 'pending' ? 'border-amber-300 bg-amber-50'
                : 'border-slate-200 bg-white';
              return (
                <span
                  key={s.label}
                  className={`inline-flex flex-col items-start justify-center rounded-2xl border ${color} px-4 py-3 shadow-sm hover:shadow transition`}
                  aria-label="Vaccine step"
                >
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    {t("Step")} {i + 1}
                  </span>
                  <span className="font-semibold">{t(s.label)}</span>
                  <span className="text-xs text-slate-600">{t(s.sub)}</span>
                  {status !== 'static' && (
                    <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      {status}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          {vaxNote && (
            <p className="mt-2 text-xs text-slate-600">{vaxNote}</p>
          )}
          {!vaxSteps && (
            <p className="mt-2 text-xs text-slate-500">
              {t("Using default schedule. Generate metrics & vaccinations to personalize.")}
            </p>
          )}
        </section>

        {/* Essentials grid */}
        <section className="mx-auto max-w-6xl px-4 mt-10">
          <TitleBar title={t("Essentials")} subtitle={t("Small habits, big impact")} t={t} />
          <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(essentialsP || essentials).map((e) => (
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
          <TitleBar title={t("Toxic to Cats")} subtitle={t("Keep these away—seek help if exposed")} t={t} />
          <div className="mt-3 flex flex-wrap gap-2" aria-label={t("Toxic items list")}>
            {(toxicP || toxic).map((tox) => (
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
          {toxicTopNote && (
            <p className="mt-2 text-xs text-slate-600">{toxicTopNote}</p>
          )}
          <a
            href="tel:+18884264435"
            className="inline-flex items-center gap-2 mt-4 rounded-full bg-[#0f172a] text-[#edfdfd] px-4 py-2 text-sm font-semibold shadow hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
            aria-label={t("Call ASPCA Poison Control")}
          >
            {t("ASPCA Poison Control")} 888-426-4435
          </a>
          <p className="mt-3 text-xs text-slate-500">
            {t("This is a simplified guide. Your vet may tailor a different plan for your cat.")}
          </p>
        </section>
      </div>
      </main>

      {/* Print Overlays */}
      {printMode === 'owner' && currentPetSummary && (
        <OwnerPrintView summary={currentPetSummary} t={t} user={user} onClose={() => setPrintMode('none')} />
      )}
      {printMode === 'vet' && currentPetSummary && (
        <VetPrintView summary={currentPetSummary} t={t} user={user} onClose={() => setPrintMode('none')} />
      )}

        {/* Local keyframes */}
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        `}</style>
    </>
  );
}

function TitleBar({ title, subtitle, t }) {
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

function HealthSnapshot({ summary, t }) {
  if (!summary || !summary.pet) return null;
  const { metrics, diseases, vaccinations } = summary;
  
  // Prefer 'all' lists if available (added in recent backend update), fallback to partials
  const allDiseases = diseases?.all || diseases?.active || [];
  const allVaccines = vaccinations?.all || vaccinations?.recent || [];

  // Local state for expandable items
  const [expandedDiseaseId, setExpandedDiseaseId] = useState(null);

  return (
    <section className="mx-auto max-w-6xl px-4 mt-8 mb-8 no-print">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 opacity-50" />
        
        <div className="relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
             <span className="text-2xl">🩺</span> {t("Health Snapshot")}
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* 1. Vitals */}
            <div className="bg-slate-50 p-4 rounded-2xl h-full">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{t("Recent Vitals")}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                   <span className="text-slate-600">{t("Weight")}</span>
                   <span className="text-lg font-bold">{metrics?.latestWeightKg ? `${metrics.latestWeightKg} kg` : "—"}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                   <span className="text-slate-600">{t("Temp")}</span>
                   <span className="text-lg font-bold">{metrics?.latestTempC ? `${metrics.latestTempC}°C` : "—"}</span>
                </div>
              </div>
            </div>

            {/* 2. Disease History (All) */}
            <div className="bg-red-50 p-4 rounded-2xl h-full overflow-y-auto max-h-[300px]">
              <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wide mb-3">{t("Disease History")}</h3>
              {allDiseases.length > 0 ? (
                <ul className="space-y-2">
                  {allDiseases.map((d) => (
                    <li key={d.id} className="bg-white/60 rounded-lg p-2 border border-red-100">
                      <button 
                        onClick={() => setExpandedDiseaseId(expandedDiseaseId === d.id ? null : d.id)}
                        className="w-full flex justify-between items-center text-left"
                      >
                        <span className={`font-bold text-sm ${d.status === 'active' ? 'text-red-700' : 'text-slate-700'}`}>
                          {d.disease_name}
                          {d.status === 'active' && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1 rounded">ACTIVE</span>}
                        </span>
                        <span className="text-xs text-slate-400">{expandedDiseaseId === d.id ? '▲' : '▼'}</span>
                      </button>
                      
                      {expandedDiseaseId === d.id && (
                        <div className="mt-2 text-xs text-slate-600 border-t border-red-100 pt-2 space-y-1">
                          <p><strong>Date:</strong> {new Date(d.diagnosed_on).toLocaleDateString()}</p>
                          <p><strong>Status:</strong> {d.status}</p>
                          {d.severity && <p><strong>Severity:</strong> {d.severity}</p>}
                          {d.notes && <p className="italic bg-white p-1 rounded border border-red-50">"{d.notes}"</p>}
                          {d.symptoms && <p><strong>Symptoms:</strong> {d.symptoms}</p>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                 <div className="text-sm text-slate-500 italic py-2">{t("No recorded diseases.")}</div>
              )}
            </div>

            {/* 3. Vaccination Record (All) */}
            <div className="bg-amber-50 p-4 rounded-2xl h-full overflow-y-auto max-h-[300px]">
               <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-3">{t("Vaccination Record")}</h3>
               {allVaccines.length > 0 ? (
                 <ul className="space-y-2">
                   {allVaccines.map((v) => {
                     // Logic: If 'administered_on' is present, it's done. Else if 'due_on' is present, it's scheduled/due.
                     const isDone = !!v.administered_on;
                     const isDue = !isDone && v.due_on;
                     
                     return (
                       <li key={v.id} className={`rounded-lg p-2 border ${isDue ? 'bg-amber-100 border-amber-200' : 'bg-white/60 border-amber-100'}`}>
                         <div className="flex justify-between items-start">
                           <span className="font-bold text-sm text-slate-800">{v.vaccine_name}</span>
                           {isDue ? (
                             <span className="text-[10px] bg-amber-200 text-amber-800 px-1 rounded font-bold">DUE</span>
                           ) : (
                             <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded font-bold">DONE</span>
                           )}
                         </div>
                         <div className="text-xs text-slate-500 mt-1">
                           {isDone ? (
                             <span>Given: {new Date(v.administered_on).toLocaleDateString()}</span>
                           ) : (
                             <span>Due: {new Date(v.due_on).toLocaleDateString()}</span>
                           )}
                         </div>
                       </li>
                     );
                   })}
                 </ul>
               ) : (
                 <div className="text-sm text-slate-500 italic py-2">{t("No vaccination records.")}</div>
               )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- Print Overlays --- */

function OwnerPrintView({ summary, t, user, onClose }) {
  const { pet, diseases, vaccinations, dewormings } = summary;
  
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto p-8 print-overlay">
      <div className="max-w-3xl mx-auto border-2 border-black p-8 min-h-screen relative">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-2">{pet.name}'s Care Sheet</h1>
            <p className="text-lg">Prepared for: {user?.username || 'Owner'}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold bg-black text-white px-3 py-1 inline-block mb-1">{t("FOR FRIDGE")}</div>
            <div className="text-sm">{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* 3-Column Quick Info */}
        <div className="grid grid-cols-3 gap-6 mb-8 text-center bg-gray-50 p-4 rounded-lg border border-gray-200">
           <div>
             <div className="text-xs uppercase text-gray-500 font-bold">{t("Weight")}</div>
             <div className="text-xl font-bold">{summary.metrics?.latestWeightKg || "—"} kg</div>
           </div>
           <div>
             <div className="text-xs uppercase text-gray-500 font-bold">{t("Microchip/Tag")}</div>
             <div className="text-xl font-bold">{pet.id}</div>
           </div>
           <div>
             <div className="text-xs uppercase text-gray-500 font-bold">{t("Vet Contact")}</div>
             <div className="text-sm font-bold truncate">See App</div>
           </div>
        </div>

        {/* Routine Checklist (Interactive for paper) */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 uppercase border-b border-black pb-1">{t("Daily Routine Checklist")}</h2>
          <div className="space-y-4">
             {['Morning Feed', 'Fresh Water', 'Litter Scoop', 'Play Session 1', 'Evening Feed', 'Medications (if any)'].map(item => (
               <div key={item} className="flex items-center gap-4 py-2 border-b border-gray-100">
                 <div className="w-6 h-6 border-2 border-black rounded shadow-sm"></div>
                 <span className="text-lg font-medium">{item}</span>
               </div>
             ))}
          </div>
        </section>

        {/* Active Medications / Concerns */}
        <section className="mb-8 p-4 bg-yellow-50 border-2 border-black rounded-xl">
           <h2 className="text-xl font-bold mb-2 flex items-center gap-2">⚠️ {t("Active Health Watch")}</h2>
           {diseases?.active?.length ? (
             <ul className="list-disc pl-5">
               {diseases.active.map(d => (
                 <li key={d.id} className="text-lg">
                   <strong>{d.disease_name}:</strong> {d.notes || d.symptoms}
                 </li>
               ))}
             </ul>
           ) : (
             <p className="text-gray-500">{t("No active medical concerns recorded.")}</p>
           )}
        </section>

        {/* Upcoming Dates */}
        <section className="grid grid-cols-2 gap-8">
           <div>
              <h3 className="font-bold border-b border-black mb-2">{t("Upcoming Vaccines")}</h3>
              {vaccinations?.nextDue ? (
                <div className="py-2">
                   <div className="font-bold text-lg">{vaccinations.nextDue.vaccine_name}</div>
                   <div>Due: {new Date(vaccinations.nextDue.due_on).toLocaleDateString()}</div>
                </div>
              ) : <p className="text-gray-400 py-2">Up to date</p>}
           </div>
           <div>
              <h3 className="font-bold border-b border-black mb-2">{t("Emergency Contacts")}</h3>
              <div className="py-2 space-y-2 h-32 border border-gray-300 rounded p-2 bg-gray-50">
                 <p className="text-sm text-gray-400 italic">Write contacts here...</p>
              </div>
           </div>
        </section>

        <div className="mt-12 text-center text-xs text-gray-400 print:hidden">
          <button onClick={onClose} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-red-700">Close Preview</button>
        </div>
      </div>
      <style>{`@media print { .print:hidden { display: none; } body > *:not(.print-overlay){ display: none; } .print-overlay { display: block; background: white; height: auto; overflow: visible; padding: 0; } }`}</style>
    </div>
  );
}

function VetPrintView({ summary, t, onClose }) {
  const { pet, metrics, diseases, vaccinations, dewormings } = summary;
  const trend = metrics.trend || [];
  
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto p-8 print-overlay">
      <div className="max-w-4xl mx-auto border border-gray-300 p-8 min-h-screen">
         {/* Professional Header */}
         <div className="flex border-b-2 border-gray-800 pb-6 mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-1">Health Status Report</h1>
              <p className="text-gray-500 text-sm uppercase tracking-widest">Generated via PawPal App</p>
            </div>
            <div className="text-right">
               <div className="font-bold text-xl">{pet.name}</div>
               <div className="text-sm text-gray-600">{pet.breed} • {pet.sex} • {new Date().getFullYear() - new Date(pet.birthdate).getFullYear()}y</div>
               <div className="text-sm text-gray-600">ID: #{pet.id}</div>
            </div>
         </div>

         {/* Vitals Table */}
         <section className="mb-8">
            <h2 className="text-sm font-bold uppercase bg-gray-100 p-2 mb-2">Recent Vitals Log</h2>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-1">Date</th>
                  <th className="py-1">Weight</th>
                  <th className="py-1">Temp</th>
                  <th className="py-1">HR / RR</th>
                  <th className="py-1">Notes</th>
                </tr>
              </thead>
              <tbody>
                {trend.slice(0, 5).map(m => (
                  <tr key={m.id} className="border-b border-gray-100">
                    <td className="py-2">{new Date(m.measured_at).toLocaleDateString()}</td>
                    <td>{m.weight_kg ? `${m.weight_kg} kg` : '-'}</td>
                    <td>{m.body_temp_c ? `${m.body_temp_c}°C` : '-'}</td>
                    <td>{m.heart_rate_bpm || '-'}/{m.respiration_rate_bpm || '-'}</td>
                    <td className="italic text-gray-500">{m.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
         </section>

         <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Medical History */}
            <section>
              <h2 className="text-sm font-bold uppercase bg-gray-100 p-2 mb-2">Medical History</h2>
              <div className="border border-gray-200 rounded">
                 {(diseases?.active || []).map(d => (
                   <div key={d.id} className="p-3 border-b border-gray-100 last:border-0 bg-red-50">
                      <div className="flex justify-between font-bold text-red-900">
                        <span>{d.disease_name} (Active)</span>
                        <span className="text-xs">{new Date(d.diagnosed_on).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm mt-1">{d.notes || d.symptoms}</p>
                   </div>
                 ))}
                 
                 {/* Filter resolved or show message if logic allows, for now listing active */}
                 {!(diseases?.active?.length) && <div className="p-4 text-gray-500 italic">No active conditions.</div>}
              </div>
            </section>

            {/* Vaccine History */}
            <section>
              <h2 className="text-sm font-bold uppercase bg-gray-100 p-2 mb-2">Vaccination Record</h2>
              <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b"><th>Vaccine</th><th>Date</th><th>Due</th></tr>
                 </thead>
                 <tbody>
                   {(vaccinations?.recent || []).map(v => (
                     <tr key={v.id} className="border-b border-gray-50">
                       <td className="py-2 font-medium">{v.vaccine_name}</td>
                       <td>{new Date(v.administered_on).toLocaleDateString()}</td>
                       <td className="text-gray-500">{v.due_on ? new Date(v.due_on).toLocaleDateString() : '-'}</td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </section>
         </div>

         <div className="mt-12 pt-6 border-t border-gray-300 text-center">
             <p className="text-xs text-gray-400">Validated by User Report • Not an official medical certificate</p> 
         </div>

         <div className="mt-6 text-center text-xs text-gray-400 print:hidden">
            <button onClick={onClose} className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-slate-900">Close Report</button>
         </div>
      </div>
      <style>{`@media print { .print:hidden { display: none; } body > *:not(.print-overlay){ display: none; } .print-overlay { display: block; background: white; height: auto; overflow: visible; padding: 0; } }`}</style>
    </div>
  );
}





