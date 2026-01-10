import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import { useLanguage } from "../context/LanguageContext";
import Footer from "../components/Footer";

const diseaseCards = [
  {
    name: "Feline flu",
    zone: "Zone A",
    img: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=60",
  },
  {
    name: "Eye infection",
    zone: "Zone A",
    img: "https://images.unsplash.com/photo-1533733879549-5c04db90b473?auto=format&fit=crop&w=600&q=60",
  },
  {
    name: "Skin/fungal",
    zone: "Zone B",
    img: "https://images.unsplash.com/photo-1601758261070-0df7b9f8e11a?auto=format&fit=crop&w=600&q=60",
  },
  {
    name: "Parasitic",
    zone: "Zone C",
    img: "https://images.unsplash.com/photo-1535242208474-9a2793260ca4?auto=format&fit=crop&w=600&q=60",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const infoRef = useRef(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const { t } = useLanguage();

  const goLogin = () => navigate("/login");
  const scrollDown = () => infoRef.current?.scrollIntoView({ behavior: "smooth" });

  // scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInfoVisible(true)),
      { threshold: 0.25 }
    );
    if (infoRef.current) obs.observe(infoRef.current);
    return () => infoRef.current && obs.unobserve(infoRef.current);
  }, []);

  return (
    <div className="min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden relative">
      {/* animated background shapes */}
      <div className="pointer-events-none fixed -top-32 -left-16 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed top-40 -right-10 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
      <div className="pointer-events-none fixed bottom-10 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed -bottom-24 right-20 h-72 w-72 border-18 border-[#fdd142]/20 rounded-full animate-[spin_20s_linear_infinite]" />

      {/* NAV */}
      <header className="w-full mx-auto flex items-center justify-between px-6 md:px-16 py-4 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="h-20 w-20 rounded-xl overflow-hidden animate-[popin_0.5s_ease]">
    <img src="/logo.png" alt="PawPal logo" className="h-full w-full object-contain" />
        </div>
          <span className="text-2xl md:text-3xl lg:text-4xl font-bold leading-none">PawPal</span>

        </div>
        <button
          onClick={goLogin}
          aria-label={t('Login')}
          className="hidden md:inline-flex px-5 py-2 rounded-full bg-[#0f172a] text-[#edfdfd] text-sm font-medium hover:bg-slate-900 transition"
        >
          {t('Login')}
        </button>



      </header>

      {/* HERO */}
      <main className="px-6 md:px-16 pt-4 pb-16 relative z-10">
        {/* diagonal dots */}
        <div className="pointer-events-none absolute -top-10 right-8 h-40 w-40 opacity-30 animate-[slideDots_10s_linear_infinite]">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0f172a]/40" />
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* LEFT */}
          <div className="space-y-6 animate-[slideup_0.6s_ease-out]">
            <span className="inline-flex items-center gap-2 bg-white/70 border border-white/80 rounded-full px-4 py-1 text-xs text-slate-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              {t('Real-time cat protection platform')}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-slate-900">
              {t('Protect every')}{" "}
              <span className="text-[#0f172a] underline decoration-4 decoration-[#fdd14280]">
                paw
              </span>{" "}
              {t('in your area.')}
            </h1>
            <p className="text-slate-700 max-w-xl">
              {t('PawProtector helps shelters, rescuers, and pet parents log incidents, track health, and alert volunteers — in one friendly dashboard.')}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={goLogin}
                aria-label={t('Login to dashboard')}
                className="px-6 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px]"
              >
                {t('Login to dashboard')}
              </button>
              <button
                onClick={scrollDown}
                aria-label={t('How it works')}
                className="px-6 py-3 rounded-full bg-white text-slate-900 font-medium border border-slate-200 hover:border-slate-300 transition"
              >
                {t('How it works')}
              </button>
            </div>
            <div className="flex gap-8 pt-2">
              <div className="animate-[fadein_1s_ease]">
                <p className="text-2xl font-bold text-slate-900">1.2k+</p>
                <p className="text-xs text-slate-500">{t('active caretakers')}</p>
              </div>
              <div className="animate-[fadein_1.2s_ease]">
                <p className="text-2xl font-bold text-slate-900">24/7</p>
                <p className="text-xs text-slate-500">{t('monitoring ready')}</p>
              </div>
              <div className="animate-[fadein_1.4s_ease]">
                <p className="text-2xl font-bold text-slate-900">60%</p>
                <p className="text-xs text-slate-500">{t('faster response')}</p>
              </div>
            </div>
          </div>

          {/* RIGHT — horizontal span of disease cards */}
          <div className="flex justify-center md:justify-end relative">
            {/* floating yellow balls */}
            <div className="absolute -top-8 -left-10 h-20 w-20 bg-[#fdd142] rounded-full opacity-70 animate-[float_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-2 -right-8 h-14 w-14 bg-[#fdd142] rounded-full opacity-80 animate-[float_4s_ease-in-out_infinite_alternate]" />

            <div className="relative w-full max-w-sm bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-lg p-4 md:p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#0f172a]/70">
                    {t('Same zone illnesses')}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {t('Recent flags in 200m radius')}
                  </p>
                </div>
                <span className="text-[10px] bg-[#fdd142] text-black px-2 py-1 rounded-full">
                  {t('Live')}
                </span>
              </div>
              {/* horizontal cards */}
              <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2 pr-2">
                {diseaseCards.map((d, i) => (
                  <div
                    key={i}
                    className="min-w-[180px] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:-translate-y-1 transition"
                  >
                    <div className="h-24 bg-slate-200 overflow-hidden">
                      <img
                        src={d.img}
                        alt={t(d.name)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-slate-900">{t(d.name)}</p>
                      <p className="text-[11px] text-slate-500 mb-2">
                        {t('Detected in')} {t(d.zone)}
                      </p>
                      <button
                        onClick={goLogin}
                        aria-label={t('View log')}
                        className="text-[11px] px-3 py-1 rounded-full bg-[#0f172a] text-[#edfdfd] hover:bg-slate-900 transition"
                      >
                        {t('view log')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-slate-400">
                {t('*replace these images with your real disease dataset')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* INFO SECTION */}
      <section ref={infoRef} className="px-6 md:px-16 pb-16 relative z-10">
        <div className="pointer-events-none absolute -top-10 left-36 h-12 w-12 bg-[#fdd142] rounded-full opacity-70 animate-[bouncey_5s_ease-in-out_infinite]" />
        <div
          className={`max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-10 transition-all duration-700 ${infoVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">
            {t('What PawProtector gives you')}
          </h2>
          <p className="text-slate-600 mb-6">
            {t('Your operational view of outdoor / stray / community cats in one place.')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#edfdfd] border border-slate-100 rounded-2xl p-4 hover:-translate-y-1 hover:shadow-sm transition">
              <p className="text-sm font-medium text-slate-900">{t('Live alerts')}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t('See when a cat is injured or in unsafe location.')}
              </p>
            </div>
            <div className="bg-[#edfdfd] border border-slate-100 rounded-2xl p-4 hover:-translate-y-1 hover:shadow-sm transition delay-75">
              <p className="text-sm font-medium text-slate-900">{t('Health notes')}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t('Volunteers add notes, you get a clean history.')}
              </p>
            </div>
            <div className="bg-[#edfdfd] border border-slate-100 rounded-2xl p-4 hover:-translate-y-1 hover:shadow-sm transition delay-100">
              <p className="text-sm font-medium text-slate-900">{t('Rescue zones')}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t('Map hot spots, feeders, and unsafe streets.')}
              </p>
            </div>
          </div>
          <button
            onClick={goLogin}
            aria-label={t('Login to continue')}
            className="mt-6 px-6 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] text-sm font-semibold hover:bg-slate-900 transition"
          >
            {t('Login to continue')}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">
          © {new Date().getFullYear()} PawProtector. {t('Protect every paw')} 🐾
        </p>
      </section>
      <Footer />

      {/* keyframes */}
      <style>{`
        @keyframes slideup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadein {
          from { opacity: 0; }
          to { opacity: 1; }
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
        @keyframes popin {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
