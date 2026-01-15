// petCare.jsx — interactive 7-day routine + vaccine tracker
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import apiConfig from "../config/apiConfig";
import Header from '../components/Header'
import { usePet } from "../context/PetContext";
import { useAuth } from "../context/AuthContext";
import { normalizeSpecies, normalizeVaccineName, VACCINE_CORE_BY_SPECIES } from "../constants/careCatalog";

/**
 * This version focuses on *readability* and *delight*:
 * - Flashcards (horizontal scroll, no autoplay) for daily routine
 * - Compact life-stage cards
 * - Vaccine timeline as stepper chips
 * Keep/extend styles from your LandingPage palette (#edfdfd, #0f172a, #fdd142)
 */
export default function PetCare() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { currentPet, currentPetSummary } = usePet();
  const { user } = useAuth();
  const [printMode, setPrintMode] = useState('none'); // 'none', 'owner', 'vet'
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const printMenuRef = useRef(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenSlowHint, setShowGenSlowHint] = useState(false);

  const dailyFallback = [
    {
      title: "Morning",
      key: "morning",
      points: [
        "Refresh water bowl and observe intake",
        "Offer a portioned meal and note appetite",
        "Scoop litter and check stool/urine",
      ],
    },
    {
      title: "Mid-day",
      key: "midday",
      points: [
        "Gentle play (5–10 min) or calm bonding",
        "Leave a quiet hiding spot undisturbed",
      ],
    },
    {
      title: "Evening",
      key: "evening",
      points: [
        "Offer dinner portion and note appetite",
        "Quick coat/skin check and brushing",
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
  const [sources, setSources] = useState(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const petId = typeof window !== "undefined"
    ? Number(localStorage.getItem("current_pet_id") || localStorage.getItem("selected_pet_id") || "")
    : null;

  const userId = user?.id ?? null;

  const userLocation = useMemo(() => {
    try {
      const key = `user_location_${userId ?? 'anon'}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [userId]);

  const [ownerContacts, setOwnerContacts] = useState({
    owner_phone: "",
    emergency_phone: "",
    poison_control: "",
    notes: "",
  });

  useEffect(() => {
    if (!petId) return;
    const key = `print_contacts_${userId ?? 'anon'}_${petId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setOwnerContacts(JSON.parse(raw));
    } catch {}
  }, [userId, petId]);

  const persistOwnerContacts = useCallback((next) => {
    setOwnerContacts(next);
    if (!petId) return;
    const key = `print_contacts_${userId ?? 'anon'}_${petId}`;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [userId, petId]);

  const [nearbyClinics, setNearbyClinics] = useState([]);
  const [nearbyClinicsLoading, setNearbyClinicsLoading] = useState(false);
  const [nearbyClinicsError, setNearbyClinicsError] = useState("");

  const [medicalRecord, setMedicalRecord] = useState(null);
  const [medicalRecordLoading, setMedicalRecordLoading] = useState(false);
  const [medicalRecordError, setMedicalRecordError] = useState("");

  useEffect(() => {
    const onDocDown = (e) => {
      if (!printMenuOpen) return;
      const el = printMenuRef.current;
      if (el && !el.contains(e.target)) {
        setPrintMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPrintMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [printMenuOpen]);

  useEffect(() => {
    let ignore = false;
    async function loadNearby() {
      if (printMode !== 'owner') return;
      if (!token) return;
      const lat = userLocation?.latitude;
      const lng = userLocation?.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      setNearbyClinicsLoading(true);
      setNearbyClinicsError("");
      try {
        const qs = new URLSearchParams({ lat: String(lat), lng: String(lng), limit: '5' });
        const res = await fetch(`${apiConfig.baseURL}/api/clinics/nearby?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json().catch(() => ({}));
        if (!ignore) {
          if (res.ok && json.success) {
            setNearbyClinics(Array.isArray(json.clinics) ? json.clinics : []);
          } else {
            setNearbyClinics([]);
            setNearbyClinicsError(json?.error || 'Could not load nearby clinics');
          }
        }
      } catch {
        if (!ignore) {
          setNearbyClinics([]);
          setNearbyClinicsError('Could not load nearby clinics');
        }
      } finally {
        if (!ignore) setNearbyClinicsLoading(false);
      }
    }
    loadNearby();
    return () => { ignore = true; };
  }, [printMode, token, userLocation]);

  useEffect(() => {
    let ignore = false;
    async function loadMedicalRecord() {
      if (printMode !== 'vet') return;
      if (!token || !petId) return;
      setMedicalRecordLoading(true);
      setMedicalRecordError("");
      try {
        const res = await fetch(`${apiConfig.baseURL}/api/pets/${petId}/medical-record`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json().catch(() => ({}));
        if (!ignore) {
          if (res.ok && json.success) {
            setMedicalRecord(json.record || null);
          } else {
            setMedicalRecord(null);
            setMedicalRecordError(json?.error || 'Could not load medical record');
          }
        }
      } catch {
        if (!ignore) {
          setMedicalRecord(null);
          setMedicalRecordError('Could not load medical record');
        }
      } finally {
        if (!ignore) setMedicalRecordLoading(false);
      }
    }
    loadMedicalRecord();
    return () => { ignore = true; };
  }, [printMode, token, petId]);

  const petSpecies = normalizeSpecies(currentPetSummary?.pet?.species || currentPet?.species);
  const latestMetric = currentPetSummary?.metrics?.trend?.[0] || null;

  const redFlags = useMemo(() => {
    const flags = [];
    if (!latestMetric) return flags;
    if (latestMetric.straining_to_pee) flags.push("straining_to_pee");
    if (latestMetric.blood_in_stool) flags.push("blood_in_stool");
    return flags;
  }, [latestMetric]);

  const signalChips = useMemo(() => {
    const chips = [];
    if (!latestMetric) return chips;
    if (latestMetric.appetite_state === "decreased") chips.push({ k: "appetite", label: t("Appetite decreased") });
    if (latestMetric.water_intake_state === "decreased") chips.push({ k: "water", label: t("Water intake decreased") });
    if (latestMetric.stool_consistency === "constipation") chips.push({ k: "stool", label: t("Constipation") });
    if (latestMetric.urine_frequency === "low") chips.push({ k: "urine", label: t("Low urine output") });
    return chips;
  }, [latestMetric, t]);

  const weeklyFocus = useMemo(() => {
    // Rotating focus reduces the “robotic repetition” feel.
    const map = [
      t("Hydration + litter focus"),
      t("Hydration + litter focus"),
      t("Appetite + gentle activity"),
      t("Appetite + gentle activity"),
      t("Body condition + coat check"),
      t("Review notes + patterns"),
      t("Weekly summary + decide if vet visit needed"),
    ];
    return map;
  }, [t]);

  const routineStorageKey = useMemo(() => {
    const dateKey = plan?.days?.[dayIndex]?.date
      ? String(plan.days[dayIndex].date).slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    return petId ? `routine_state_${petId}_${dateKey}` : null;
  }, [petId, plan, dayIndex]);

  const [routineState, setRoutineState] = useState({ done: {}, note: "" });

  useEffect(() => {
    if (!routineStorageKey) return;
    try {
      const raw = localStorage.getItem(routineStorageKey);
      setRoutineState(raw ? JSON.parse(raw) : { done: {}, note: "" });
    } catch {
      setRoutineState({ done: {}, note: "" });
    }
  }, [routineStorageKey]);

  const persistRoutineState = useCallback(
    (next) => {
      setRoutineState(next);
      if (!routineStorageKey) return;
      try {
        localStorage.setItem(routineStorageKey, JSON.stringify(next));
      } catch {}
    },
    [routineStorageKey]
  );

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
          if (!ignore) setSources(null);
        } else if (planRes.status === 412) {
          const j = await planRes.json().catch(() => ({}));
          if (!ignore) setError(j?.message_bn || "Weekly metrics not updated.");
        } else if (planRes.ok) {
          const planJson = await planRes.json();
          if (!ignore) {
            setPlan(planJson.plan || null);
            setDayIndex(0);
            setSources(planJson.sources || null);
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
    setIsGenerating(true);
    setShowGenSlowHint(true);
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
      if (data.sources) {
        setSources(data.sources);
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
      setIsGenerating(false);
    }
  };


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
                  <span>{t("Pet Care")}</span>
                </span>
                <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">{t("7-Day Care Routine")}</h1>
                <p className="mt-2 text-slate-600 max-w-2xl">
                  {summary && typeof summary === 'object'
                    ? `${summary.current_status_bn || ''}${summary.trend_bn ? ` (${summary.trend_bn})` : ''}`
                    : t("Skim-friendly flashcards you can follow daily. Details are simplified—ask your veterinarian for personal advice.")
                  }
                </p>

                {!!signalChips.length && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {signalChips.map((c) => (
                      <span key={c.k} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={loading || isGenerating || !petId}
                  className={`inline-flex items-center gap-2 rounded-full ${(loading || isGenerating) ? "bg-slate-400" : "bg-[#0f172a] hover:bg-slate-900"} text-[#edfdfd] px-5 py-3 font-semibold shadow transition`}
                  aria-label={t("Generate Flashcards")}
                  title={!petId ? t("Select a pet first") : t("Generate this week's plan")}
                >
                  {(loading || isGenerating) ? t("Generating…") : t("Generate Flashcards")}
                </button>
                {(isGenerating || showGenSlowHint) && (
                  <div className="text-xs text-slate-600 max-w-[260px]">
                    {t("Generating can take up to ~30 seconds. Please keep this tab open.")}
                  </div>
                )}
                <div className="relative" ref={printMenuRef}>
                  <button
                    type="button"
                    onClick={() => setPrintMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold shadow hover:shadow-md transition"
                    aria-label={t("Print Options")}
                    aria-haspopup="menu"
                    aria-expanded={printMenuOpen ? 'true' : 'false'}
                  >
                    {t("Print / Export")}
                  </button>
                  {printMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-50 p-1">
                      <button
                        type="button"
                        onClick={() => { setPrintMenuOpen(false); setPrintMode('owner'); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-slate-50 rounded-lg"
                        role="menuitem"
                      >
                        <div className="font-semibold">{t("For Me (Owner)")}</div>
                        <div className="text-xs text-slate-500">{t("Summary + 7-day plan + emergency + nearby vets")}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPrintMenuOpen(false); setPrintMode('vet'); }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-slate-50 rounded-lg"
                        role="menuitem"
                      >
                        <div className="font-semibold">{t("For Vet")}</div>
                        <div className="text-xs text-slate-500">{t("All-time medical record")}</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Health Snapshot Section */}
        {/* {currentPetSummary && (
           <HealthSnapshot summary={currentPetSummary} t={t} />
        )} */}

        {/* Daily flashcards */}
        <section id="daily" className="mx-auto max-w-6xl px-4 mt-8">
          <TitleBar title={t("Today’s Routine")} subtitle={t("Morning, mid-day, evening — with a rotating weekly focus")} t={t} />

          

          {/* Plan reminders (non-alarming) */}
          {(plan?.days?.[dayIndex]?.reminders?.length || plan?.global_reminders?.length) && (
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              {/* Safety layer */}
              {!!redFlags.length && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/70 p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-sm font-extrabold text-red-800 flex items-center gap-2">
                        <span aria-hidden="true">⚠️</span>
                        {t("Vet alert")}
                      </div>
                      <p className="mt-2 text-sm text-red-800">
                        {t("Some of today’s signals can be urgent. If your pet is straining to pee or has blood in stool, contact a vet promptly.")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate("/find-a-vet")}
                        className="inline-flex items-center justify-center rounded-full bg-[#0f172a] text-[#edfdfd] px-4 py-2 text-sm font-semibold shadow hover:bg-slate-900 transition"
                      >
                        {t("Find a Vet")}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/vaccination-alerts")}
                        className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:shadow transition"
                      >
                        {t("Open Alerts")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {plan?.days?.[dayIndex]?.reminders?.length ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <h4 className="text-sm font-semibold text-amber-900">{t("Today’s notes")}</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
                    {plan.days[dayIndex].reminders.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div />
              )}

              {plan?.global_reminders?.length ? (
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <h4 className="text-sm font-semibold text-slate-900">{t("This week")}</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {plan.global_reminders.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div />
              )}
              
            </div>
          )}
          {/* Day toggler (7 days) */}
          <div className="mt-12 flex flex-wrap gap-2">
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-700">
              <span className="font-semibold">{t("Focus")}: </span>
              {weeklyFocus[dayIndex] || weeklyFocus[0]}
            </div>
            <div className="w-full md:w-[420px]">
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t("Notes")}</label>
              <input
                value={routineState.note || ""}
                onChange={(e) => persistRoutineState({ ...routineState, note: e.target.value })}
                placeholder={t("Anything to remember today (appetite, litter, behavior)")}
                className="w-full px-4 py-2 rounded-2xl border border-slate-200 bg-white/90 shadow-sm text-sm"
              />
            </div>
          </div>

          
              
          {plan?.days?.length ? (
            <div className="mt-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-4 min-w-max">
                <RoutineCard
                  title={t("Morning")}
                  sectionKey="morning"
                  points={(plan?.days?.[dayIndex]?.morning || []).filter((x) => !/vaccine|deworm/i.test(String(x)))}
                  routineState={routineState}
                  setRoutineState={persistRoutineState}
                  t={t}
                />
                <RoutineCard
                  title={t("Mid-day")}
                  sectionKey="midday"
                  points={(plan?.days?.[dayIndex]?.midday || []).filter((x) => !/vaccine|deworm/i.test(String(x)))}
                  routineState={routineState}
                  setRoutineState={persistRoutineState}
                  t={t}
                />
                <RoutineCard
                  title={t("Evening")}
                  sectionKey="evening"
                  points={(plan?.days?.[dayIndex]?.evening || []).filter((x) => !/vaccine|deworm/i.test(String(x)))}
                  routineState={routineState}
                  setRoutineState={persistRoutineState}
                  t={t}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-4 min-w-max">
                {dailyFallback.map((card) => (
                  <RoutineCard
                    key={card.title}
                    title={t(card.title)}
                    sectionKey={card.key}
                    points={card.points}
                    routineState={routineState}
                    setRoutineState={persistRoutineState}
                    t={t}
                  />
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
        
        {/* Vaccines (tracker aligned with Vaccination Alerts types) */}
        <section className="mx-auto max-w-6xl px-4 mt-10">
          <TitleBar
            title={t("Vaccines")}
            subtitle={t("Track what’s given vs missing (core types match Vaccination Alerts)")}
            t={t}
          />

          <div className="mt-4 bg-white/70 border border-white rounded-3xl shadow p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-bold text-slate-900">{t("Core vaccines tracker")}</div>
                <div className="text-sm text-slate-600">
                  {petSpecies ? t("Based on species") + `: ${petSpecies}` : t("Select a pet to personalize this list.")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/vaccination-alerts")}
                className="inline-flex items-center justify-center rounded-full bg-[#0f172a] text-[#edfdfd] px-4 py-2 text-sm font-semibold shadow hover:bg-slate-900 transition"
              >
                {t("Open Vaccination Alerts")}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <VaccineCoreTracker
                species={petSpecies}
                vaccinations={currentPetSummary?.vaccinations?.all || currentPetSummary?.vaccinations?.recent || []}
                t={t}
              />
            </div>

            {vaxNote && <p className="mt-3 text-xs text-slate-600">{vaxNote}</p>}
            {vaxSteps?.length ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">{t("Typical timeline")}</summary>
                <div className="mt-3 flex flex-wrap gap-3">
                  {vaxSteps.map((s) => (
                    <span
                      key={s.label}
                      className="inline-flex flex-col items-start justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <span className="font-semibold">{t(s.label)}</span>
                      <span className="text-xs text-slate-600">{t(s.sub)}</span>
                    </span>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </section>

        <div className="h-24" aria-hidden="true" />
      </div>
      </main>

      {/* Print Overlays */}
      {printMode === 'owner' && currentPetSummary && (
        <OwnerPrintView
          summary={currentPetSummary}
          t={t}
          user={user}
          plan={plan}
          weeklyFocus={weeklyFocus}
          nearbyClinics={nearbyClinics}
          nearbyClinicsLoading={nearbyClinicsLoading}
          nearbyClinicsError={nearbyClinicsError}
          ownerContacts={ownerContacts}
          setOwnerContacts={persistOwnerContacts}
          onClose={() => setPrintMode('none')}
          onPrint={() => window.print()}
        />
      )}
      {printMode === 'vet' && currentPetSummary && (
        <VetPrintView
          summary={currentPetSummary}
          t={t}
          user={user}
          record={medicalRecord}
          recordLoading={medicalRecordLoading}
          recordError={medicalRecordError}
          onClose={() => setPrintMode('none')}
          onPrint={() => window.print()}
        />
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

function RoutineCard({ title, sectionKey, points, routineState, setRoutineState, t }) {
  const safePoints = Array.isArray(points) ? points : [];

  const toggle = (idx) => {
    const id = `${sectionKey}:${idx}`;
    const nextDone = { ...(routineState?.done || {}) };
    nextDone[id] = !nextDone[id];
    setRoutineState({ ...(routineState || {}), done: nextDone });
  };

  const completed = safePoints.reduce((acc, _p, i) => {
    const id = `${sectionKey}:${i}`;
    return acc + ((routineState?.done || {})[id] ? 1 : 0);
  }, 0);

  return (
    <article
      className="snap-center shrink-0 w-[280px] sm:w-[340px] bg-white/95 border border-white rounded-3xl shadow p-5 hover:shadow-lg transition"
      aria-label={t("Daily routine section")}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-lg">{title}</h3>
        <div className="text-xs font-semibold text-slate-600">
          {completed}/{safePoints.length}
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {safePoints.map((p, idx) => {
          const id = `${sectionKey}:${idx}`;
          const checked = !!(routineState?.done || {})[id];
          return (
            <label
              key={id}
              className={
                "flex items-start gap-3 rounded-2xl border px-3 py-2 cursor-pointer select-none " +
                (checked ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white")
              }
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={checked}
                onChange={() => toggle(idx)}
                aria-label={t("Mark done")}
              />
              <span className={"text-sm " + (checked ? "text-slate-700" : "text-slate-800")}>{t(p)}</span>
            </label>
          );
        })}
      </div>
    </article>
  );
}

function VaccineCoreTracker({ species, vaccinations, t }) {
  const core = (species && VACCINE_CORE_BY_SPECIES[species]) ? VACCINE_CORE_BY_SPECIES[species] : [];

  const byName = useMemo(() => {
    const map = new Map();
    (Array.isArray(vaccinations) ? vaccinations : []).forEach((v) => {
      const canon = normalizeVaccineName(v?.vaccine_name);
      if (!canon) return;
      const prev = map.get(canon) || [];
      map.set(canon, [...prev, v]);
    });
    return map;
  }, [vaccinations]);

  if (!core.length) {
    return (
      <div className="text-sm text-slate-600">
        {t("No core vaccine list available for this species.")}
      </div>
    );
  }

  return core.map((name) => {
    const rows = byName.get(name) || [];
    const mostRecent = rows
      .filter((r) => r?.administered_on)
      .sort((a, b) => new Date(b.administered_on) - new Date(a.administered_on))[0];

    const given = !!mostRecent;
    const due = mostRecent?.due_on ? String(mostRecent.due_on).slice(0, 10) : null;
    const givenOn = mostRecent?.administered_on ? String(mostRecent.administered_on).slice(0, 10) : null;

    return (
      <span
        key={name}
        className={
          "inline-flex flex-col items-start justify-center rounded-2xl border px-4 py-3 shadow-sm " +
          (given ? "border-emerald-200 bg-emerald-50/60" : "border-red-200 bg-red-50/50")
        }
      >
        <span className="text-xs uppercase tracking-wide text-slate-500">{given ? t("Given") : t("Missing")}</span>
        <span className="font-semibold text-slate-900">{t(name)}</span>
        <span className="text-xs text-slate-600">
          {givenOn ? `${t("Given")}: ${givenOn}` : t("No record yet")}
        </span>
        {due && (
          <span className="text-xs text-slate-600">{t("Due")}: {due}</span>
        )}
      </span>
    );
  });
}


// function HealthSnapshot({ summary, t }) {
//   if (!summary || !summary.pet) return null;
//   const { metrics, diseases, vaccinations } = summary;
  
//   // Prefer 'all' lists if available (added in recent backend update), fallback to partials
//   const allDiseases = diseases?.all || diseases?.active || [];
//   const allVaccines = vaccinations?.all || vaccinations?.recent || [];

//   // Local state for expandable items
//   const [expandedDiseaseId, setExpandedDiseaseId] = useState(null);

//   return (
//     <section className="mx-auto max-w-6xl px-4 mt-8 mb-8 no-print">
//       <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
//         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 opacity-50" />
        
//         <div className="relative z-10">
//           <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
//              <span className="text-2xl">🩺</span> {t("Health Snapshot")}
//           </h2>

//           <div className="grid md:grid-cols-3 gap-6">
//             {/* 1. Vitals */}
//             <div className="bg-slate-50 p-4 rounded-2xl h-full">
//               <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{t("Recent Vitals")}</h3>
//               <div className="space-y-4">
//                 <div className="flex justify-between items-end border-b border-slate-200 pb-2">
//                    <span className="text-slate-600">{t("Weight")}</span>
//                    <span className="text-lg font-bold">{metrics?.latestWeightKg ? `${metrics.latestWeightKg} kg` : "—"}</span>
//                 </div>
//                 <div className="flex justify-between items-end border-b border-slate-200 pb-2">
//                    <span className="text-slate-600">{t("Temp")}</span>
//                    <span className="text-lg font-bold">{metrics?.latestTempC ? `${metrics.latestTempC}°C` : "—"}</span>
//                 </div>
//               </div>
//             </div>

//             {/* 2. Disease History (All) */}
//             <div className="bg-red-50 p-4 rounded-2xl h-full overflow-y-auto max-h-[300px]">
//               <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wide mb-3">{t("Disease History")}</h3>
//               {allDiseases.length > 0 ? (
//                 <ul className="space-y-2">
//                   {allDiseases.map((d) => (
//                     <li key={d.id} className="bg-white/60 rounded-lg p-2 border border-red-100">
//                       <button 
//                         onClick={() => setExpandedDiseaseId(expandedDiseaseId === d.id ? null : d.id)}
//                         className="w-full flex justify-between items-center text-left"
//                       >
//                         <span className={`font-bold text-sm ${d.status === 'active' ? 'text-red-700' : 'text-slate-700'}`}>
//                           {d.disease_name}
//                           {d.status === 'active' && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1 rounded">ACTIVE</span>}
//                         </span>
//                         <span className="text-xs text-slate-400">{expandedDiseaseId === d.id ? '▲' : '▼'}</span>
//                       </button>
                      
//                       {expandedDiseaseId === d.id && (
//                         <div className="mt-2 text-xs text-slate-600 border-t border-red-100 pt-2 space-y-1">
//                           <p><strong>Date:</strong> {new Date(d.diagnosed_on).toLocaleDateString()}</p>
//                           <p><strong>Status:</strong> {d.status}</p>
//                           {d.severity && <p><strong>Severity:</strong> {d.severity}</p>}
//                           {d.notes && <p className="italic bg-white p-1 rounded border border-red-50">"{d.notes}"</p>}
//                           {d.symptoms && <p><strong>Symptoms:</strong> {d.symptoms}</p>}
//                         </div>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               ) : (
//                  <div className="text-sm text-slate-500 italic py-2">{t("No recorded diseases.")}</div>
//               )}
//             </div>

//             {/* 3. Vaccination Record (All) */}
//             <div className="bg-amber-50 p-4 rounded-2xl h-full overflow-y-auto max-h-[300px]">
//                <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-3">{t("Vaccination Record")}</h3>
//                {allVaccines.length > 0 ? (
//                  <ul className="space-y-2">
//                    {allVaccines.map((v) => {
//                      // Logic: If 'administered_on' is present, it's done. Else if 'due_on' is present, it's scheduled/due.
//                      const isDone = !!v.administered_on;
//                      const isDue = !isDone && v.due_on;
                     
//                      return (
//                        <li key={v.id} className={`rounded-lg p-2 border ${isDue ? 'bg-amber-100 border-amber-200' : 'bg-white/60 border-amber-100'}`}>
//                          <div className="flex justify-between items-start">
//                            <span className="font-bold text-sm text-slate-800">{v.vaccine_name}</span>
//                            {isDue ? (
//                              <span className="text-[10px] bg-amber-200 text-amber-800 px-1 rounded font-bold">DUE</span>
//                            ) : (
//                              <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded font-bold">DONE</span>
//                            )}
//                          </div>
//                          <div className="text-xs text-slate-500 mt-1">
//                            {isDone ? (
//                              <span>Given: {new Date(v.administered_on).toLocaleDateString()}</span>
//                            ) : (
//                              <span>Due: {new Date(v.due_on).toLocaleDateString()}</span>
//                            )}
//                          </div>
//                        </li>
//                      );
//                    })}
//                  </ul>
//                ) : (
//                  <div className="text-sm text-slate-500 italic py-2">{t("No vaccination records.")}</div>
//                )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

/* --- Print Overlays --- */

function OwnerPrintView({
  summary,
  t,
  user,
  plan,
  weeklyFocus,
  nearbyClinics,
  nearbyClinicsLoading,
  nearbyClinicsError,
  ownerContacts,
  setOwnerContacts,
  onClose,
  onPrint,
}) {
  const { pet } = summary;
  const days = Array.isArray(plan?.days) ? plan.days : [];
  
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto p-8 print-overlay">
      <div className="max-w-4xl mx-auto border border-slate-200 rounded-3xl p-8 min-h-screen relative bg-white shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">{pet.name} — {t("Owner Summary")}</h1>
            <p className="text-sm text-slate-600">{t("Prepared for")}: {user?.username || t('Owner')} • {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold bg-[#0f172a] text-[#edfdfd] px-3 py-1 rounded-full inline-flex">{t("PRINT COPY")}</div>
          </div>
        </div>

        {/* 3-Column Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 bg-[#edfdfd] p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-600 font-bold">{t("Species")}</div>
            <div className="text-lg font-extrabold text-slate-900">{pet.species || '—'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-[#fffef7] p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-600 font-bold">{t("Weight")}</div>
            <div className="text-lg font-extrabold text-slate-900">{summary.metrics?.latestWeightKg || "—"} kg</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-600 font-bold">{t("Breed")}</div>
            <div className="text-lg font-extrabold text-slate-900">{pet.breed || '—'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-widest text-slate-600 font-bold">{t("Pet ID")}</div>
            <div className="text-lg font-extrabold text-slate-900">#{pet.id}</div>
          </div>
        </div>

        {/* 7-day plan */}
        <section className="mb-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-3">{t("7-Day Plan")}</h2>
          {days.length ? (
            <div className="grid md:grid-cols-2 gap-4">
              {days.slice(0, 7).map((d, i) => (
                <div key={d.date || i} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {new Date(d.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{t("Focus")}: {weeklyFocus?.[i] || weeklyFocus?.[0] || ''}</div>
                    </div>
                    <div className="text-xs font-bold text-slate-700 bg-[#fdd142]/60 rounded-full px-3 py-1">Day {i + 1}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <div className="text-xs font-bold text-slate-600 uppercase">{t("Morning")}</div>
                      <ul className="mt-1 list-disc pl-5 text-slate-800">
                        {(d.morning || []).slice(0, 5).map((x, idx) => (<li key={idx}>{x}</li>))}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <div className="text-xs font-bold text-slate-600 uppercase">{t("Mid-day")}</div>
                      <ul className="mt-1 list-disc pl-5 text-slate-800">
                        {(d.midday || []).slice(0, 4).map((x, idx) => (<li key={idx}>{x}</li>))}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <div className="text-xs font-bold text-slate-600 uppercase">{t("Evening")}</div>
                      <ul className="mt-1 list-disc pl-5 text-slate-800">
                        {(d.evening || []).slice(0, 4).map((x, idx) => (<li key={idx}>{x}</li>))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {t("No generated plan yet. Click Generate Flashcards first.")}
            </div>
          )}
        </section>

        {/* Emergency + contacts */}
        <section className="mb-8 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">{t("Emergency Contacts")}</h3>
            <div className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-bold text-slate-600">{t("Owner phone")}</span>
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={ownerContacts.owner_phone || ''}
                  onChange={(e) => setOwnerContacts({ ...ownerContacts, owner_phone: e.target.value })}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-bold text-slate-600">{t("Emergency contact")}</span>
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={ownerContacts.emergency_phone || ''}
                  onChange={(e) => setOwnerContacts({ ...ownerContacts, emergency_phone: e.target.value })}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-bold text-slate-600">{t("Poison control / hotline")}</span>
                <input
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={ownerContacts.poison_control || ''}
                  onChange={(e) => setOwnerContacts({ ...ownerContacts, poison_control: e.target.value })}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-bold text-slate-600">{t("Notes")}</span>
                <textarea
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm min-h-[92px]"
                  value={ownerContacts.notes || ''}
                  onChange={(e) => setOwnerContacts({ ...ownerContacts, notes: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">{t("These fields are saved locally for this pet.")}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">{t("Nearby Vets")}</h3>
            {nearbyClinicsLoading ? (
              <div className="text-sm text-slate-600">{t("Loading nearby clinics…")}</div>
            ) : nearbyClinicsError ? (
              <div className="text-sm text-red-700">{nearbyClinicsError}</div>
            ) : nearbyClinics?.length ? (
              <div className="grid gap-3">
                {nearbyClinics.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 bg-[#edfdfd] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-600">{c.address || ''}</div>
                      </div>
                      {typeof c.distance_km === 'number' && (
                        <div className="text-xs font-bold text-slate-700 bg-white rounded-full px-3 py-1 border border-slate-200">
                          {c.distance_km.toFixed(1)} km
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-slate-800">
                      {c.phone ? (<div><span className="font-semibold">{t("Phone")}: </span>{c.phone}</div>) : null}
                      {c.email ? (<div><span className="font-semibold">{t("Email")}: </span>{c.email}</div>) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                {t("No nearby clinics found. Update your profile location to enable this section.")}
              </div>
            )}
          </div>
        </section>

        <div className="mt-12 text-center text-xs text-gray-400 print:hidden">
          <div className="flex items-center justify-center gap-3">
            <button onClick={onClose} className="border border-slate-300 bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow-sm hover:shadow">{t("Close")}</button>
            <button onClick={onPrint} className="bg-[#0f172a] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-slate-900">{t("Print")}</button>
          </div>
        </div>
      </div>
      <style>{`@media print {
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print\\:hidden { display: none !important; }
        /* React app is mounted under #root; only print the overlay */
        #root > *:not(.print-overlay) { display: none !important; }
        .print-overlay {
          display: block !important;
          position: static !important;
          inset: auto !important;
          background: white !important;
          height: auto !important;
          overflow: visible !important;
          padding: 0 !important;
        }
      }`}</style>
    </div>
  );
}

function VetPrintView({ summary, t, user, record, recordLoading, recordError, onClose, onPrint }) {
  const pet = record?.pet || summary?.pet;
  const metrics = record?.metrics || [];
  const diseases = record?.diseases || [];
  const vaccinations = record?.vaccinations || [];
  const dewormings = record?.dewormings || [];
  const appointments = record?.appointments || [];
  
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto p-8 print-overlay">
      <div className="max-w-5xl mx-auto border border-slate-200 rounded-3xl p-8 min-h-screen bg-white shadow-sm">
         {/* Professional Header */}
         <div className="flex border-b border-slate-200 pb-6 mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">{t("Veterinary Medical Record")}</h1>
              <p className="text-slate-600 text-sm">{t("All-time history")}{user?.username ? ` • ${t("Owner")}: ${user.username}` : ''} • {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
               <div className="font-extrabold text-xl text-slate-900">{pet?.name || ''}</div>
               <div className="text-sm text-slate-600">{[pet?.species, pet?.breed, pet?.sex].filter(Boolean).join(' • ')}</div>
               <div className="text-sm text-slate-600">{t("Pet ID")}: #{pet?.id || ''}</div>
            </div>
         </div>

         {recordLoading && (
           <div className="rounded-2xl border border-slate-200 bg-[#fffef7] p-4 text-sm text-slate-700 mb-6">
             {t("Loading full medical record…")}
           </div>
         )}
         {recordError && (
           <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-sm text-red-800 mb-6">
             {recordError}
           </div>
         )}

         {/* Vitals Table */}
         <section className="mb-8">
            <h2 className="text-sm font-extrabold uppercase bg-[#edfdfd] border border-slate-200 rounded-xl p-3 mb-2">{t("Vitals / Metrics")}</h2>
            <table className="w-full text-sm text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-2 px-3">{t("Date")}</th>
                  <th className="py-2 px-3">{t("Weight")}</th>
                  <th className="py-2 px-3">{t("Temp")}</th>
                  <th className="py-2 px-3">{t("HR/RR")}</th>
                  <th className="py-2 px-3">{t("Notes")}</th>
                </tr>
              </thead>
              <tbody>
                {(metrics || []).map((m, idx) => (
                  <tr key={m.id || idx} className="border-b border-slate-100">
                    <td className="py-2 px-3">{m.measured_at ? new Date(m.measured_at).toLocaleDateString() : '-'}</td>
                    <td className="px-3">{m.weight_kg != null ? `${m.weight_kg} kg` : '-'}</td>
                    <td className="px-3">{m.body_temp_c != null ? `${m.body_temp_c}°C` : '-'}</td>
                    <td className="px-3">{m.heart_rate_bpm || '-'} / {m.respiration_rate_bpm || '-'}</td>
                    <td className="px-3 text-slate-600">{m.note || '-'}</td>
                  </tr>
                ))}
                {!(metrics || []).length && (
                  <tr><td colSpan={5} className="py-3 px-3 text-slate-500 italic">{t("No metrics recorded.")}</td></tr>
                )}
              </tbody>
            </table>
         </section>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Medical History */}
            <section className="break-inside-avoid">
              <h2 className="text-sm font-extrabold uppercase bg-[#fff0f0] border border-red-200 rounded-xl p-3 mb-2">{t("Conditions / Diagnoses")}</h2>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                 {(diseases || []).map((d, idx) => (
                   <div key={d.id || idx} className="p-3 border-b border-slate-100 last:border-0">
                      <div className="flex justify-between gap-3">
                        <div className="font-bold text-slate-900">
                          {d.disease_name}
                          {d.status ? (
                            <span className={"ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full " + (d.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700')}>
                              {String(d.status).toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-slate-600">
                          {d.diagnosed_on ? new Date(d.diagnosed_on).toLocaleDateString() : (d.created_at ? new Date(d.created_at).toLocaleDateString() : '')}
                        </div>
                      </div>
                      {d.severity ? <div className="text-xs text-slate-600 mt-1">{t("Severity")}: {d.severity}</div> : null}
                      {d.symptoms ? <div className="text-sm text-slate-700 mt-1"><span className="font-semibold">{t("Symptoms")}: </span>{d.symptoms}</div> : null}
                      {d.notes ? <div className="text-sm text-slate-700 mt-1"><span className="font-semibold">{t("Notes")}: </span>{d.notes}</div> : null}
                      {d.clinic_name ? <div className="text-xs text-slate-500 mt-1">{t("Clinic")}: {d.clinic_name}{d.clinic_phone ? ` • ${d.clinic_phone}` : ''}</div> : null}
                   </div>
                 ))}
                 {!(diseases || []).length && <div className="p-4 text-slate-500 italic">{t("No conditions recorded.")}</div>}
              </div>
            </section>

            {/* Vaccines + Deworm */}
            <section className="break-inside-avoid">
              <h2 className="text-sm font-extrabold uppercase bg-[#fffef7] border border-slate-200 rounded-xl p-3 mb-2">{t("Vaccinations")}</h2>
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                 <thead>
                   <tr className="border-b border-slate-200 bg-slate-50">
                     <th className="py-2 px-3">{t("Vaccine")}</th>
                     <th className="py-2 px-3">{t("Given")}</th>
                     <th className="py-2 px-3">{t("Due")}</th>
                     <th className="py-2 px-3">{t("Clinic")}</th>
                   </tr>
                 </thead>
                 <tbody>
                   {(vaccinations || []).map((v, idx) => (
                     <tr key={v.id || idx} className="border-b border-slate-100">
                       <td className="py-2 px-3 font-semibold text-slate-900">{v.vaccine_name}</td>
                       <td className="px-3">{v.administered_on ? new Date(v.administered_on).toLocaleDateString() : '-'}</td>
                       <td className="px-3 text-slate-600">{v.due_on ? new Date(v.due_on).toLocaleDateString() : '-'}</td>
                       <td className="px-3 text-slate-600">{v.clinic_name || '-'}</td>
                     </tr>
                   ))}
                   {!(vaccinations || []).length && (
                     <tr><td colSpan={4} className="py-3 px-3 text-slate-500 italic">{t("No vaccinations recorded.")}</td></tr>
                   )}
                 </tbody>
              </table>

              <h2 className="text-sm font-extrabold uppercase bg-[#edfdfd] border border-slate-200 rounded-xl p-3 mb-2 mt-6">{t("Dewormings")}</h2>
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                 <thead>
                   <tr className="border-b border-slate-200 bg-slate-50">
                     <th className="py-2 px-3">{t("Product")}</th>
                     <th className="py-2 px-3">{t("Given")}</th>
                     <th className="py-2 px-3">{t("Due")}</th>
                     <th className="py-2 px-3">{t("Notes")}</th>
                   </tr>
                 </thead>
                 <tbody>
                   {(dewormings || []).map((d, idx) => (
                     <tr key={d.id || idx} className="border-b border-slate-100">
                       <td className="py-2 px-3 font-semibold text-slate-900">{d.product_name}</td>
                       <td className="px-3">{d.administered_on ? new Date(d.administered_on).toLocaleDateString() : '-'}</td>
                       <td className="px-3 text-slate-600">{d.due_on ? new Date(d.due_on).toLocaleDateString() : '-'}</td>
                       <td className="px-3 text-slate-600">{d.notes || '-'}</td>
                     </tr>
                   ))}
                   {!(dewormings || []).length && (
                     <tr><td colSpan={4} className="py-3 px-3 text-slate-500 italic">{t("No dewormings recorded.")}</td></tr>
                   )}
                 </tbody>
              </table>
            </section>
         </div>

         <section className="mb-8 break-inside-avoid">
           <h2 className="text-sm font-extrabold uppercase bg-slate-100 border border-slate-200 rounded-xl p-3 mb-2">{t("Appointments")}</h2>
           <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
             <thead>
               <tr className="border-b border-slate-200 bg-slate-50">
                 <th className="py-2 px-3">{t("Start")}</th>
                 <th className="py-2 px-3">{t("Status")}</th>
                 <th className="py-2 px-3">{t("Vet")}</th>
                 <th className="py-2 px-3">{t("Clinic")}</th>
                 <th className="py-2 px-3">{t("Reason")}</th>
               </tr>
             </thead>
             <tbody>
               {(appointments || []).map((a, idx) => (
                 <tr key={a.id || idx} className="border-b border-slate-100">
                   <td className="py-2 px-3">{a.starts_at ? new Date(a.starts_at).toLocaleString() : '-'}</td>
                   <td className="px-3 text-slate-700">{a.status || '-'}</td>
                   <td className="px-3 text-slate-700">{a.vet_name || '-'}</td>
                   <td className="px-3 text-slate-700">{a.clinic_name || '-'}</td>
                   <td className="px-3 text-slate-600">{a.reason || '-'}</td>
                 </tr>
               ))}
               {!(appointments || []).length && (
                 <tr><td colSpan={5} className="py-3 px-3 text-slate-500 italic">{t("No appointments recorded.")}</td></tr>
               )}
             </tbody>
           </table>
         </section>

         <div className="mt-12 pt-6 border-t border-gray-300 text-center">
             <p className="text-xs text-slate-500">{t("User-reported log + clinic entries. Not an official certificate.")}</p>
         </div>

         <div className="mt-6 text-center text-xs text-gray-400 print:hidden">
            <div className="flex items-center justify-center gap-3">
              <button onClick={onClose} className="border border-slate-300 bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow-sm hover:shadow">{t("Close")}</button>
              <button onClick={onPrint} className="bg-[#0f172a] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-slate-900">{t("Print")}</button>
            </div>
         </div>
      </div>
      <style>{`@media print {
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print\\:hidden { display: none !important; }
        /* React app is mounted under #root; only print the overlay */
        #root > *:not(.print-overlay) { display: none !important; }
        .print-overlay {
          display: block !important;
          position: static !important;
          inset: auto !important;
          background: white !important;
          height: auto !important;
          overflow: visible !important;
          padding: 0 !important;
        }
      }`}</style>
    </div>
  );
}





