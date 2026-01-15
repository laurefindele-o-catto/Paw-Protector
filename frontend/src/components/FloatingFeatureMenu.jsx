import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const FEATURE_ROUTES = [
  "/guide",
  "/skinDiseaseDetection",
  "/petcare",
  "/find-a-vet",
  "/vaccination-alerts",
];

export default function FloatingFeatureMenu() {
  const { t } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isFeaturePage = FEATURE_ROUTES.includes(location.pathname);

  useEffect(() => {
    // Close on route change
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const items = useMemo(
    () => [
      { to: "/guide", label: t("Guide") },
      { to: "/skinDiseaseDetection", label: t("Disease Detection") },
      { to: "/petcare", label: t("Pet Care") },
      { to: "/find-a-vet", label: t("Find a Vet") },
      { to: "/vaccination-alerts", label: t("Vaccination Alerts") },
    ],
    [t]
  );

  if (!isFeaturePage) return null;

  return (
    <>
      {/* Toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "fixed left-4 top-24 z-40 inline-flex items-center justify-center h-14 w-14 rounded-2xl " +
          "bg-[#0f172a] text-[#edfdfd] border border-[#fdd142]/70 shadow-xl hover:shadow-2xl transition " +
          "focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2 " +
          (open ? "ring-2 ring-[#fdd142]/60" : "")
        }
        aria-label={open ? t("Close menu") : t("Open menu")}
        aria-expanded={open}
        title={t("Features")}
      >
        <span className="sr-only">{open ? t("Close") : t("Menu")}</span>
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4 7H20M4 12H20M4 17H20"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Overlay (click to close) */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20"
          aria-label={t("Close")}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      <aside
        style={{ top: "9.5rem" }}
        className={
          "fixed left-4 z-40 w-[260px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 backdrop-blur-md border border-white shadow-2xl overflow-hidden transition " +
          (open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-2")
        }
        aria-hidden={!open}
      >
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-slate-500">{t("Features")}</div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-2 py-1 rounded-full hover:bg-slate-100 transition"
            aria-label={t("Close")}
          >
            ✕
          </button>
        </div>

        <nav className="p-2" aria-label={t("Feature navigation")}>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                "flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#fdd142]/60 focus:ring-offset-2 " +
                (isActive
                  ? "bg-[#0f172a] text-[#edfdfd] shadow"
                  : "text-[#0f172a] hover:bg-[#fdd142]/30")
              }
            >
              <span>{it.label}</span>
              <span aria-hidden="true" className="text-slate-400">
                →
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
