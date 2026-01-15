// dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeaturesSection from "../components/FeaturesSection";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Header from "../components/Header";
import { usePet } from "../context/PetContext";
import PetSwitcher from "../components/PetSwitcher";
import Footer from "../components/Footer";
import ChatButton from "../components/ChatButton";
import apiConfig from "../config/apiConfig";

const placeholder = "/placeholder.png"; 

function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const { t } = useLanguage();
  const { pets, currentPet, currentPetSummary, refreshSummary } = usePet();

  const [user, setUser] = useState(null);
  const currentPetCount = Number(localStorage.getItem('pet_count') || 0);

  const userId = user?.id ?? null;
  const storageKey = useMemo(() => {
    const id = userId ?? 'anon';
    return {
      location: `user_location_${id}`,
      visitedSkin: `quick_setup_${id}_visited_skin`,
      visitedAssistant: `quick_setup_${id}_visited_assistant`,
      visitedPetProfile: `quick_setup_${id}_visited_pet_profile`,
      quickStartDismissed: `quick_setup_${id}_dismissed`,
    };
  }, [userId]);

  const [visited, setVisited] = useState({
    skin: false,
    assistant: false,
    petProfile: false,
  });

  const [quickCollapsed, setQuickCollapsed] = useState(false);
  const [quickDismissed, setQuickDismissed] = useState(false);

  const [activeModal, setActiveModal] = useState(null); // 'skin' | 'assistant' | 'petProfile' | null
  const [healthifyOpen, setHealthifyOpen] = useState(false);
  const defaultHealthForm = React.useCallback(() => ({
    measured_at: new Date().toISOString().slice(0, 16),
    weight_kg: "",
    body_temp_c: "",
    gum_color: "pink",
    body_condition_score: "",
    coat_skin: "",
    appetite_state: "",
    water_intake_state: "",
    stool_consistency: "",
    urine_frequency: "",
    clump_size: "",
    blood_in_stool: false,
    straining_to_pee: false,
    no_poop_48h: false,
    note: ""
  }), []);
  const [healthForm, setHealthForm] = useState(() => defaultHealthForm());
  const [healthSaving, setHealthSaving] = useState(false);
  const [healthError, setHealthError] = useState("");

  const [healthChecksPreview, setHealthChecksPreview] = useState([]);
  const [healthChecksPreviewLoading, setHealthChecksPreviewLoading] = useState(false);
  const [healthChecksPreviewError, setHealthChecksPreviewError] = useState("");
  

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }

    const user_local = JSON.parse(localStorage.getItem("user"));
    setUser(user_local);
    if(user_local?.roles[0] !== "owner"){
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    let alive = true;

    const run = async () => {
      setHealthChecksPreviewLoading(true);
      setHealthChecksPreviewError("");
      try {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.healthChecks.mine}?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || data?.message || "Failed to load health checks");
        const list = Array.isArray(data?.requests) ? data.requests : [];
        const filteredList = currentPet?.id ? list.filter((r) => Number(r.pet_id) === Number(currentPet.id)) : list;
        // Keep a few more so we can still show latest responded feedback
        if (alive) setHealthChecksPreview(filteredList.slice(0, 10));
      } catch (e) {
        if (!alive) return;
        setHealthChecksPreview([]);
        setHealthChecksPreviewError(e?.message || "Failed to load health checks");
      } finally {
        if (alive) setHealthChecksPreviewLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, token, currentPet?.id]);

  useEffect(() => {
    try {
      setVisited({
        skin: localStorage.getItem(storageKey.visitedSkin) === '1',
        assistant: localStorage.getItem(storageKey.visitedAssistant) === '1',
        petProfile: localStorage.getItem(storageKey.visitedPetProfile) === '1',
      });
      setQuickDismissed(localStorage.getItem(storageKey.quickStartDismissed) === '1');
    } catch {
      setVisited({ skin: false, assistant: false, petProfile: false });
      setQuickDismissed(false);
    }
  }, [storageKey]);

  const hasPet =
    (pets?.length || 0) > 0 ||
    currentPetCount > 0 ||
    !!localStorage.getItem('current_pet_id') ||
    !!localStorage.getItem('current_pet');

  const hasProfileLocation = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey.location);
      if (!raw) return false;
      const loc = JSON.parse(raw);
      const hasLatLng = typeof loc?.latitude === 'number' && typeof loc?.longitude === 'number';
      const hasAddress = !!(loc?.address_line || loc?.city || loc?.country);
      return hasLatLng || hasAddress;
    } catch {
      return false;
    }
  }, [storageKey]);

  const steps = useMemo(() => {
    return [
      {
        id: 'pet',
        label: 'Add your first pet',
        done: hasPet,
        onClick: () => navigate('/addPet'),
      },
      {
        id: 'profile',
        label: 'Update Your profile',
        done: hasProfileLocation,
        onClick: () => navigate('/profile'),
      },
      {
        id: 'skin',
        label: 'visit our skin disease detector',
        done: visited.skin,
        onClick: () => (visited.skin ? navigate('/skinDiseaseDetection') : setActiveModal('skin')),
      },
      {
        id: 'assistant',
        label: 'visit your assistant',
        done: visited.assistant,
        onClick: () => (visited.assistant ? navigate('/assistant') : setActiveModal('assistant')),
      },
      {
        id: 'petProfile',
        label: 'Visit pet profile',
        done: visited.petProfile,
        onClick: () => (visited.petProfile ? navigate('/pet-profile') : setActiveModal('petProfile')),
      },
    ];
  }, [hasPet, hasProfileLocation, visited.skin, visited.assistant, visited.petProfile, navigate]);

  const allSetupDone = steps.every(s => s.done);

  const lastMetricDate = currentPetSummary?.metrics?.trend?.[0]?.measured_at ? new Date(currentPetSummary.metrics.trend[0].measured_at) : null;

  useEffect(() => {
    if (!currentPet || !currentPet?.id) return;
    const key = `healthify_prompt_${currentPet.id}`;
    const todayTag = new Date().toDateString();
    const lastPrompted = localStorage.getItem(key);
    const stale = !lastMetricDate || ((Date.now() - new Date(lastMetricDate).getTime()) / (1000 * 60 * 60 * 24) >= 2);
    if (stale && lastPrompted !== todayTag) {
      setHealthifyOpen(true);
      localStorage.setItem(key, todayTag);
    }
  }, [currentPet?.id, lastMetricDate]);

  useEffect(() => {
    const handler = () => setHealthifyOpen(true);
    window.addEventListener('open-healthify', handler);
    return () => window.removeEventListener('open-healthify', handler);
  }, []);

  const openHealthify = () => {
    setHealthError("");
    setHealthForm(defaultHealthForm());
    setHealthifyOpen(true);
  };

  const onHealthChange = (k) => (e) => setHealthForm(s => ({ ...s, [k]: e.target.value }));
  const onHealthBool = (k) => (e) => setHealthForm(s => ({ ...s, [k]: e.target.checked }));

  const saveHealthQuick = async () => {
    if (!token || !currentPet?.id) return;
    setHealthSaving(true);
    setHealthError("");
    const payload = {
      measured_at: healthForm.measured_at ? new Date(healthForm.measured_at).toISOString() : new Date().toISOString(),
      weight_kg: healthForm.weight_kg === "" ? null : Number(healthForm.weight_kg),
      body_temp_c: healthForm.body_temp_c === "" ? null : Number(healthForm.body_temp_c),
      gum_color: healthForm.gum_color || null,
      body_condition_score: healthForm.body_condition_score === "" ? null : Number(healthForm.body_condition_score),
      coat_skin: healthForm.coat_skin || null,
      appetite_state: healthForm.appetite_state || null,
      water_intake_state: healthForm.water_intake_state || null,
      stool_consistency: healthForm.stool_consistency || null,
      urine_frequency: healthForm.urine_frequency || null,
      clump_size: healthForm.clump_size || null,
      blood_in_stool: healthForm.blood_in_stool,
      straining_to_pee: healthForm.straining_to_pee,
      no_poop_48h: healthForm.no_poop_48h,
      note: healthForm.note || null
    };
    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.pets.metrics.add(currentPet.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save metrics");
      setHealthifyOpen(false);
      setHealthForm(defaultHealthForm());
      refreshSummary?.();
    } catch (err) {
      setHealthError(err.message || "Could not save metrics");
    } finally {
      setHealthSaving(false);
    }
  };

  const modalContent = useMemo(() => {
    if (activeModal === 'skin') {
      return {
        title: t('Skin Disease Detector'),
        body: t('Upload a clear photo and we will estimate what it might be. This is ML-assisted and can give accurate result in most cases but not a medical diagnosis. Please consult a veterinarian for confirmation.'),
        goTo: '/skinDiseaseDetection',
        flagKey: storageKey.visitedSkin,
        flagName: 'skin'
      };
    }
    if (activeModal === 'assistant') {
      return {
        title: t('Assistant'),
        body: t('Ask questions about care, food, vaccines, and symptoms. The assistant can guide you, your personal trainer for pets. Will give you advice based on well-trusted database for pets.'),
        goTo: '/assistant',
        flagKey: storageKey.visitedAssistant,
        flagName: 'assistant'
      };
    }
    if (activeModal === 'petProfile') {
      return {
        title: t('Pet Profile'),
        body: t('View and update your pet’s health summary, vaccines, deworming, diseases, and metrics. Keeping this updated helps the app give better suggestions.'),
        goTo: '/pet-profile',
        flagKey: storageKey.visitedPetProfile,
        flagName: 'petProfile'
      };
    }
    return null;
  }, [activeModal, storageKey, t]);

  const confirmModal = () => {
    if (!modalContent) return;
    try { localStorage.setItem(modalContent.flagKey, '1'); } catch {}
    setVisited((v) => ({ ...v, [modalContent.flagName]: true }));
    const to = modalContent.goTo;
    setActiveModal(null);
    navigate(to);
  };

  return (
    <>
      <Header />
      <main id="main-content" role="main" tabIndex="-1">
      <div className="relative min-h-screen flex flex-col bg-[#edfdfd] text-slate-900 overflow-hidden mt-28">
        {/* animated background shapes */}
        <div className="pointer-events-none fixed -top-32 -left-16 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
        <div className="pointer-events-none fixed top-40 -right-10 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
        <div className="pointer-events-none fixed bottom-10 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />
        <div className="pointer-events-none fixed -bottom-24 right-20 h-72 w-72 border-18 border-[#fdd142]/20 rounded-full animate-[spin_20s_linear_infinite]" />

        {/* diagonal dots accent */}
        <div className="pointer-events-none absolute -top-6 right-8 h-32 w-32 opacity-30 animate-[slideDots_10s_linear_infinite]">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0f172a]/40" />
            ))}
          </div>
        </div>

        {!allSetupDone && !quickDismissed && (
          <section className="mx-auto max-w-6xl w-full px-4 mt-2">
            <div className="bg-white/75 backdrop-blur-md border border-white rounded-3xl shadow p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                    {t('Get started')}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {t('Complete these steps to unlock the full experience.')}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{steps.filter(s => s.done).length}/{steps.length} {t('done')}</span>
                  <button
                    type="button"
                    onClick={() => setQuickCollapsed(v => !v)}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white/80 hover:bg-white text-slate-700"
                  >
                    {quickCollapsed ? t('Expand') : t('Collapse')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { try { localStorage.setItem(storageKey.quickStartDismissed, '1'); } catch {}; setQuickDismissed(true); }}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white/80 hover:bg-white text-slate-700"
                    aria-label={t('Close quick start')}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {!quickCollapsed && (
              <div className="mt-4">
                {/* First row: 3 cards */}
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                  {steps.slice(0, 3).map((step, idx) => {
                    const prevDone = steps.slice(0, idx).every(s => s.done);
                    const locked = !prevDone;
                    const disabled = locked;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => { if (!disabled) step.onClick(); }}
                        className={
                          "text-left w-full px-4 py-3 rounded-2xl border border-white bg-white/60 transition-all min-h-[76px] " +
                          (disabled
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:bg-white/85 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30")
                        }
                        aria-disabled={disabled}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className={"font-semibold text-slate-900 " + (step.done ? "line-through text-slate-500" : "")}
                          >
                            {idx + 1}. {t(step.label)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Second row: 2 cards, centered */}
                <div className="grid grid-cols-2 gap-3 mt-2 max-w-md mx-auto">
                  {steps.slice(3, 5).map((step, idx) => {
                    const prevDone = steps.slice(0, idx + 3).every(s => s.done);
                    const locked = !prevDone;
                    const disabled = locked;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => { if (!disabled) step.onClick(); }}
                        className={
                          "text-left w-full px-4 py-3 rounded-2xl border border-white bg-white/60 transition-all min-h-[76px] " +
                          (disabled
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:bg-white/85 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30")
                        }
                        aria-disabled={disabled}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className={"font-semibold text-slate-900  whitespace-nowrap w-full " + (step.done ? "line-through text-slate-500" : "")}
                            style={{maxWidth: 'calc(100% - 70px)'}}
                          >
                            {idx + 4}. {t(step.label)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}
            </div>
          </section>
        )}

        {hasPet && (
          <section className="mx-auto w-full sm:px-4">
            <FeaturesSection />

            <div className="w-full flex justify-center my-8">
              <div className="mt-4 h-[3px] w-2/3 bg-linear-to-r from-[#fdd142] via-[#0f172a]/30 to-[#fdd142] rounded-full shadow-md opacity-70" />
            </div>
          </section>
        )}

        {hasPet && <PetSwitcher healthChecksPreview={healthChecksPreview} />}

        {/* Random Cat Fact */}
        <section className="mx-auto max-w-6xl w-full px-4">
          <div className="text-center backdrop-blur-md rounded-3xl p-6">
            <h2 className="text-lg md:text-xl italic text-slate-700">
              {t("Cats sleep for 70% of their lives.")}
            </h2>
          </div>
        </section>

        {/* Bottom spacing */}
        <br /><br /><br /><br />
      </div>
      </main>

      <Footer />

      {/* Floating Chat Button */}
      <ChatButton />

      {healthifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHealthifyOpen(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-white p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase text-slate-500">Healthify</div>
                <h3 className="text-xl font-bold text-slate-900">Quick health check-in</h3>
                <p className="text-sm text-slate-600">Pick fast selectors for gums, BCS, appetite, water, and litter box. We auto-mark red flags.</p>
              </div>
              <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => setHealthifyOpen(false)} aria-label={t('Close')}>
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-3 gap-3 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Measured at</label>
                <input type="datetime-local" value={healthForm.measured_at} onChange={onHealthChange('measured_at')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Weight (kg)</label>
                <input type="number" step="0.01" value={healthForm.weight_kg} onChange={onHealthChange('weight_kg')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Body temp (°C)</label>
                <input type="number" step="0.1" value={healthForm.body_temp_c} onChange={onHealthChange('body_temp_c')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Coat & skin</label>
                <select value={healthForm.coat_skin} onChange={onHealthChange('coat_skin')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
                  <option value="">Select</option>
                  <option value="shiny">Shiny / normal</option>
                  <option value="dull">Dull</option>
                  <option value="shedding">Excess shedding</option>
                  <option value="bald_spots">Bald spots</option>
                  <option value="dandruff">Dandruff</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-3 gap-3 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Gum color</label>
                <select value={healthForm.gum_color} onChange={onHealthChange('gum_color')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
                  <option value="pink">Pink (healthy)</option>
                  <option value="pale_white">Pale / white</option>
                  <option value="blue_gray">Blue / gray (emergency)</option>
                  <option value="yellow">Yellow (liver)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Body Condition Score (1-9)</label>
                <select value={healthForm.body_condition_score} onChange={onHealthChange('body_condition_score')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
                  <option value="">Select</option>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Appetite</label>
                <select value={healthForm.appetite_state} onChange={onHealthChange('appetite_state')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
                  <option value="">Select</option>
                  <option value="normal">Normal</option>
                  <option value="decreased">Decreased</option>
                  <option value="increased">Increased</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-3 gap-3 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Water intake</label>
                <select value={healthForm.water_intake_state} onChange={onHealthChange('water_intake_state')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
                  <option value="">Select</option>
                  <option value="normal">Normal</option>
                  <option value="decreased">Less than normal</option>
                  <option value="increased">Drinking more</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Urine frequency</label>
                <select value={healthForm.urine_frequency} onChange={onHealthChange('urine_frequency')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
                  <option value="">Select</option>
                  <option value="low">Less than normal</option>
                  <option value="normal">Normal</option>
                  <option value="high">More than normal</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Clump size</label>
                <select value={healthForm.clump_size} onChange={onHealthChange('clump_size')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
                  <option value="">Select</option>
                  <option value="small">Small</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              <div classname='flex flex-row'>
                {/* <label className="text-xs text-slate-600">Note</label> */}
                <textarea value={healthForm.note} onChange={onHealthChange('note')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" rows={5} placeholder="Optional note" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600">Flags</label>
                <div className="flex flex-col gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white/80">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={healthForm.blood_in_stool} onChange={onHealthBool('blood_in_stool')} />
                    Blood seen
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={healthForm.straining_to_pee} onChange={onHealthBool('straining_to_pee')} />
                    Straining to pee (emergency)
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={healthForm.no_poop_48h} onChange={onHealthBool('no_poop_48h')} />
                    No poop 48h
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-600">Stool consistency</label>
                  <select value={healthForm.stool_consistency} onChange={onHealthChange('stool_consistency')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
                    <option value="">Select</option>
                    <option value="normal">Normal</option>
                    <option value="diarrhea">Diarrhea</option>
                    <option value="constipation">Constipation</option>
                  </select>
                </div>
              </div>
            </div>

            {healthError && <div className="mt-3 text-sm text-rose-600">{healthError}</div>}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 hover:shadow-sm transition"
                onClick={() => setHealthifyOpen(false)}
              >
                {t('Not now')}
              </button>
              <button
                type="button"
                onClick={saveHealthQuick}
                disabled={healthSaving}
                className="px-5 py-2.5 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition disabled:opacity-60"
              >
                {healthSaving ? 'Saving...' : 'Save health metrics'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {hasPet && (
        <div className="mx-auto max-w-6xl w-full px-4 mt-6">
          <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">{t("Pet Health Checks")}</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {currentPet?.name ? t("Recent responses for your current pet") : t("Recent responses")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/health-checks")}
                className="px-4 py-2 rounded-xl bg-[#0f172a] text-[#edfdfd] font-semibold"
              >
                {t("View all")}
              </button>
            </div>

            {healthChecksPreviewError && (
              <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {healthChecksPreviewError}
              </div>
            )}

            {healthChecksPreviewLoading ? (
              <div className="mt-4 text-sm text-slate-600">{t("Loading...")}</div>
            ) : healthChecksPreview.length === 0 ? (
              <div className="mt-4 text-sm text-slate-600">
                {t("No health check requests yet.")}{" "}
                <button type="button" className="underline" onClick={() => navigate("/find-a-vet")}>
                  {t("Create one")}
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {healthChecksPreview.slice(0, 3).map((r) => (
                  <button
                    key={String(r.id)}
                    type="button"
                    onClick={() => navigate(`/health-checks/${r.id}`)}
                    className="rounded-2xl border border-slate-100 bg-white p-4 text-left hover:shadow-sm hover:border-slate-200 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs text-slate-500">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                      </div>
                      <div
                        className={
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full border " +
                          (r.status === "responded"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200")
                        }
                      >
                        {r.status === "responded" ? t("Responded") : t("Pending")}
                      </div>
                    </div>

                    <div className="mt-2 text-sm font-semibold text-slate-900 line-clamp-2">
                      {String(r.vet_full_name || r.vet_username || "Vet").trim() || "Vet"}
                    </div>
                    <div className="mt-2 text-sm text-slate-700 line-clamp-3">{r.problem_text}</div>
                    {r.status === "responded" && r.vet_response && (
                      <div className="mt-3 text-sm text-slate-900 line-clamp-3">
                        <span className="text-xs font-semibold text-slate-600">{t("Response")}: </span>
                        {r.vet_response}
                      </div>
                    )}
                    <div className="mt-3 text-xs text-slate-500">Click to view full details</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick setup modal */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{modalContent.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{modalContent.body}</p>
              </div>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700"
                onClick={() => setActiveModal(null)}
                aria-label={t('Close')}
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 hover:shadow-sm transition"
                onClick={() => setActiveModal(null)}
              >
                {t('Not now')}
              </button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition"
                onClick={confirmModal}
              >
                {t("Let's go")}
              </button>
            </div>
          </div>
        </div>
      )}

       {/* Floating Call Button */}
       <a
         href="tel:+8801888548012"
         className="fixed bottom-8 left-8 bg-red-500 w-16 h-16 flex flex-col items-center justify-center rounded-full shadow-lg hover:bg-red-600 transition transform hover:scale-110 text-center focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
         aria-label={t("Call emergency contact")}
       >
         <img src="/icons/call-icon.png" alt={t("Call icon")} className="w-6 h-6 mb-1" />
         <span className="text-[10px] font-semibold text-white leading-none">
           {t("Emergency")}
         </span>
       </a>

      {/* keyframes */}
      <style>{`
        @keyframes slideup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bouncey {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideDots {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-30px) translateX(30px); }
        }
      `}</style>
    </>
  );
}

export default Dashboard;

