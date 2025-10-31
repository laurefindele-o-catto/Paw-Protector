// PawPal.jsx — alt style: split hero, marquee motto, striped goals, KPI tickers
import React from "react";
import { useAutoTranslate } from "react-autolocalise";

export default function PawPal() {
  const { t } = useAutoTranslate();

  const goals = [
    { n: "01", title: "Clarity", desc: "Short flows. Fewer taps. No jargon." },
    { n: "02", title: "Trust", desc: "Vet-informed content, reviewed and current." },
    { n: "03", title: "Momentum", desc: "Tiny wins that build daily habits." },
    { n: "04", title: "Access", desc: "Readable, localizable, light on data." },
    { n: "05", title: "Privacy", desc: "Minimal data. Clear choices. Respect by default." },
  ];

  const kpis = [
    { value: "< 2", label: "taps for key tasks" },
    { value: "> 70%", label: "weekly retention" },
    { value: "95%", label: "first-try success" },
    { value: "< 1s", label: "perceived load" },
  ];

  const roadmap = [
    { q: "Q1", item: "Flashcard care + BN/EN" },
    { q: "Q2", item: "Find-a-vet flow" },
    { q: "Q3", item: "Reminders & streaks" },
    { q: "Q4", item: "Offline basics" },
  ];

  return (
    <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden">
      {/* Background accents (muted, different composition) */}
      <div className="pointer-events-none absolute -top-20 left-10 h-28 w-28 bg-[#fdd142]/40 rounded-full blur-2xl" />
      <div className="pointer-events-none absolute top-24 right-10 h-14 w-14 bg-[#fdd142]/60 rounded-full blur-xl" />
      <div className="pointer-events-none absolute -bottom-28 right-20 h-72 w-72 border-[14px] border-[#fdd142]/20 rounded-full animate-[spin_30s_linear_infinite]" />

      {/* Split hero */}
      <section className="relative mx-auto max-w-6xl px-4 pt-10">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-lg p-8 flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 bg-[#0f172a] text-[#edfdfd] px-3 py-1 rounded-full text-xs font-semibold w-fit" aria-label={t("Brand")}>
              🐾 PawPal
            </span>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
              {t("Make pet care obvious, not overwhelming")}
            </h1>
            <p className="mt-2 text-slate-600">
              {t("Tools that turn good intentions into easy, everyday actions.")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#motto"
                className="rounded-full bg-[#0f172a] text-[#edfdfd] px-5 py-3 font-semibold shadow hover:bg-slate-900 transition"
                aria-label={t("Go to motto")}
              >
                {t("Motto")}
              </a>
              <a
                href="#goals"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold shadow hover:shadow-md transition"
                aria-label={t("Go to goals")}
              >
                {t("Goals")}
              </a>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-white shadow-lg">
            {/* Abstract panel with diagonal stripes */}
            <div className="absolute inset-0 [background:repeating-linear-gradient(135deg,_#0f172a0f_0_14px,_transparent_14px_28px)]" />
            <div className="relative h-full min-h-[260px] grid place-items-center p-8">
              <div className="text-center">
                <div className="text-6xl font-black tracking-tight">PawPal</div>
                <p className="mt-2 text-slate-600">{t("Built for calm, confident care")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee motto */}
      <section id="motto" className="mx-auto max-w-6xl px-4 mt-8" aria-label={t("Motto marquee")}>
        <div className="overflow-hidden rounded-2xl border border-white bg-white/90 shadow">
          <div className="whitespace-nowrap animate-[marq_18s_linear_infinite] py-3">
            <span className="mx-6 text-sm md:text-base font-semibold">{t("Care made clear")}</span>
            <span className="mx-6 text-sm md:text-base font-semibold">{t("Small steps, every day")}</span>
            <span className="mx-6 text-sm md:text-base font-semibold">{t("Kind design for busy humans")}</span>
            <span className="mx-6 text-sm md:text-base font-semibold">{t("Built with privacy and trust")}</span>
            <span className="mx-6 text-sm md:text-base font-semibold">{t("Care made clear")}</span>
            <span className="mx-6 text-sm md:text-base font-semibold">{t("Small steps, every day")}</span>
            <span className="mx-6 text-sm md:text-base font-semibold">{t("Kind design for busy humans")}</span>
            <span className="mx-6 text-sm md:text-base font-semibold">{t("Built with privacy and trust")}</span>
          </div>
        </div>
      </section>

      {/* Striped goals list */}
      <section id="goals" className="mx-auto max-w-6xl px-4 mt-8" aria-label={t("Goals section")}>
        <header className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-xl md:text-2xl font-bold">{t("Goals")}</h2>
          <div className="hidden md:block h-8 w-8 rounded-full bg-[#fdd142] opacity-80" />
        </header>
        <div className="mt-4 divide-y divide-slate-100 rounded-2xl overflow-hidden border border-white bg-white/80 shadow">
          {goals.map((g, i) => (
            <div key={g.n} className={`grid grid-cols-[72px_1fr] items-center p-4 ${i % 2 ? "bg-white" : "bg-[#fffef7]"}`}>
              <div className="text-2xl font-black text-slate-900/70">{g.n}</div>
              <div>
                <div className="font-semibold">{t(g.title)}</div>
                <div className="text-sm text-slate-600">{t(g.desc)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KPI ticker cards */}
      <section className="mx-auto max-w-6xl px-4 mt-8" aria-label={t("Targets section")}>
        <header className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-xl md:text-2xl font-bold">{t("Targets")}</h2>
          <div className="hidden md:block h-8 w-8 rounded-full bg-[#fdd142] opacity-80" />
        </header>
        <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <article key={k.label} className="relative bg-white/90 border border-white rounded-2xl shadow p-5 overflow-hidden" aria-label={t("Target card")}>
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border-[10px] border-[#fdd142]/25" />
              <div className="text-3xl font-extrabold tracking-tight">{k.value}</div>
              <p className="text-sm text-slate-600">{t(k.label)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Compact roadmap */}
      <section className="mx-auto max-w-6xl px-4 mt-8 mb-24" aria-label={t("Roadmap section")}>
        <header className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-xl md:text-2xl font-bold">{t("Roadmap (sketch)")}</h2>
          <div className="hidden md:block h-8 w-8 rounded-full bg-[#fdd142] opacity-80" />
        </header>
        <div className="mt-4 relative bg-white/85 border border-white rounded-2xl shadow p-6">
          <div className="absolute left-6 top-6 bottom-6 w-1 bg-[#fdd142]/60 rounded" />
          <div className="ml-12 space-y-4">
            {roadmap.map((r) => (
              <div key={r.q} className="relative">
                <div className="absolute -left-12 top-1.5 h-3 w-3 rounded-full bg-[#0f172a]" />
                <div className="text-xs uppercase tracking-wide text-slate-500">{r.q}</div>
                <div className="font-semibold">{t(r.item)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keyframes */}
      <style>{`
        @keyframes marq { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
