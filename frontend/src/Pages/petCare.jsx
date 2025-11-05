import React, {useEffect, useState} from "react";
import { useAutoTranslate } from "react-autolocalise";
import { useNavigate } from "react-router-dom";
import apiConfig from "../config/apiConfig";

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
  const { t } = useAutoTranslate();
  const navigate = useNavigate();

  const [petSummary, setPetSummary] = useState('');

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
      } catch (err) {
        if (!ignore) setError("Network error while loading care plan.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadCare();
    setPetSummary(localStorage.getItem(`care_summary_${localStorage.getItem('current_pet_id')}`))
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
                <span>{("Cat Care")}</span>
              </span>
              <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
                {("Easy, Vet-informed Care Cards")}
              </h1>
              <p className="mt-2 text-slate-600 max-w-2xl">
                {summary
                  ? [
                      summary.current_status_bn,
                      summary.trend_bn ? ` (${summary.trend_bn})` : ''
                    ].join('')
                  : "Skim-friendly flashcards you can follow daily. Details are simplified—ask your veterinarian for personal advice."
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="#daily"
                className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] text-[#edfdfd] px-5 py-3 font-semibold shadow hover:bg-slate-900 transition"
                aria-label={("Start Daily Cards")}
              >
                {("Start Daily Cards")}
              </a>
              <button
                onClick={handleGenerate}
                disabled={loading || !petId}
                className={`inline-flex items-center gap-2 rounded-full ${loading ? "bg-slate-400" : "bg-[#0f172a] hover:bg-slate-900"} text-[#edfdfd] px-5 py-3 font-semibold shadow transition`}
                aria-label="Generate Flashcards"
                title={!petId ? "Select a pet first" : "Generate this week’s plan"}
              >
                {loading ? "Generating…" : "Generate Flashcards"}
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold shadow hover:shadow-md transition"
                aria-label={("Print")}
              >
                {("Print")}
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
        Dashboard
      </button>

      {/* Daily flashcards */}
      <section id="daily" className="mx-auto max-w-6xl px-4 mt-8">
        <Header title="Daily Care Flashcards" subtitle="This week’s plan (toggle days)" t={t} />

        {/* Day toggler (7 days) */}
        <div className="mt-3 flex flex-wrap gap-2">
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
                <FlashCard title="Morning" emoji="🌅" points={plan.days[dayIndex]?.morning || []} t={t} />
                <FlashCard title="Mid-day" emoji="🧩" points={plan.days[dayIndex]?.midday || []} t={t} />
                <FlashCard title="Evening" emoji="🌙" points={plan.days[dayIndex]?.evening || []} t={t} />
              </div>
            </div>

            {/* Day-specific reminders */}
            {plan.days[dayIndex]?.reminders?.length ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  আজকের গুরুত্বপূর্ণ মনে করিয়ে দেওয়া
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                  {plan.days[dayIndex].reminders.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Global reminders / warnings for the whole week */}
            {plan.global_reminders?.length ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/70 p-4">
                <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <span className="text-lg">🛑</span>
                  এই সপ্তাহের সতর্কতাসূচক নোট
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
                  {plan.global_reminders.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
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
                Showing default tips. Update weekly metrics and generate a plan to see personalized cards.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Life stage cards */}
      <section className="mx-auto max-w-6xl px-4 mt-10">
        <Header title="Life Stages" subtitle="Right care at the right time" t={t} />
        <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {lifeStages.map((s) => (
            <article
              key={s.label}
              className="group bg-white/90 border border-white rounded-2xl shadow p-5 hover:shadow-lg transition"
              aria-label={("Life stage card")}
            >
              <div className="text-2xl">{s.emoji}</div>
              <h3 className="mt-2 font-bold text-lg">
                {(s.label)} <span className="text-slate-500 font-normal">{s.range}</span>
              </h3>
              <p className="mt-1 text-sm text-slate-700">{(s.key)}</p>
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
              aria-label={("Vaccine step")}
            >
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {("Step")} {i + 1}
              </span>
              <span className="font-semibold">{s.label}</span>
              <span className="text-xs text-slate-600">{(s.sub)}</span>
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {(
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
              aria-label={("Essential card")}
            >
              <div className="text-2xl">{e.emoji}</div>
              <h3 className="mt-2 font-bold">{(e.title)}</h3>
              <p className="text-sm text-slate-700 mt-1">{(e.tip)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Toxic chips */}
      <section className="mx-auto max-w-6xl px-4 mt-10 mb-24">
        <Header title="Toxic to Cats" subtitle="Keep these away—seek help if exposed" t={t} />
        <div className="mt-3 flex flex-wrap gap-2" aria-label={("Toxic items list")}>
          {toxic.map((tox) => (
            <span
              key={tox}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1 text-sm shadow-sm"
              aria-label={("Toxic item")}
            >
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {(tox)}
            </span>
          ))}
        </div>
        <a
          href="tel:+18884264435"
          className="inline-flex items-center gap-2 mt-4 rounded-full bg-[#0f172a] text-[#edfdfd] px-4 py-2 text-sm font-semibold shadow hover:bg-slate-900"
          aria-label={("Call ASPCA Poison Control")}
        >
          {("ASPCA Poison Control")} 888-426-4435
        </a>
        <p className="mt-3 text-xs text-slate-500">
          {("This is a simplified guide. Your vet may tailor a different plan for your cat.")}
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
        <h2 className="text-xl md:text-2xl font-bold">{(title)}</h2>
        <p className="text-sm text-slate-600">{(subtitle)}</p>
      </div>
      <div className="hidden md:block h-10 w-10 rounded-full bg-[#fdd142] opacity-70" />
    </div>
  );
}

function FlashCard({ title, emoji, points, t }) {
  return (
    <article
      className="snap-center shrink-0 w-[280px] sm:w-[320px] bg-white/95 border border-white rounded-3xl shadow p-5 hover:shadow-lg transition"
      aria-label={("Daily card")}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{(title)}</h3>
        <div className="text-2xl">{emoji}</div>
      </div>
      <ul className="mt-3 text-sm text-slate-700 space-y-2 list-disc pl-5">
        {points.map((p, i) => (
          <li key={i}>{(p)}</li>
        ))}
      </ul>
    </article>
  );
}





