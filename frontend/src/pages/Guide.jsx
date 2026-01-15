import React, { useMemo } from "react";
import Header from "../components/Header";
import { usePet } from "../context/PetContext";
import { useLanguage } from "../context/LanguageContext";

function normalizeSpecies(raw) {
  const s = String(raw || "").toLowerCase();
  if (!s) return null;
  if (s.includes("cat") || s.includes("feline")) return "cat";
  if (s.includes("dog") || s.includes("canine")) return "dog";
  return null;
}

function SimpleTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/90 shadow-sm">
      <table className="min-w-[520px] w-full text-left">
        <thead className="bg-[#fffef7]">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 text-xs uppercase tracking-widest text-slate-600">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className={idx % 2 ? "bg-white" : "bg-slate-50/60"}>
              {r.map((cell, i) => (
                <td key={i} className="px-4 py-3 text-sm text-slate-800 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Guide() {
  const { t } = useLanguage();
  const { currentPet, currentPetSummary } = usePet();

  const petSpecies = normalizeSpecies(currentPetSummary?.pet?.species || currentPet?.species);

  const data = useMemo(() => {
    const catVaccination = [
      ["6–8 weeks", "FVRCP (1st dose)"],
      ["9–12 weeks", "FVRCP (2nd dose)"],
      ["12–16 weeks", "FVRCP (3rd dose)"],
      ["12–16 weeks", "Rabies"],
      ["1 year", "Booster (FVRCP + Rabies)"],
      ["Every year / 3 years", "Booster (vet-dependent)"],
    ];

    const catDeworming = [
      ["2–8 weeks", "Every 2 weeks"],
      ["2–6 months", "Monthly"],
      ["Adult cats", "Every 3 months"],
    ];

    const dogVaccination = [
      ["6–8 weeks", "DHPP (1st dose)"],
      ["9–12 weeks", "DHPP (2nd dose)"],
      ["12–16 weeks", "DHPP (3rd dose)"],
      ["12–16 weeks", "Rabies"],
      ["1 year", "Booster (DHPP + Rabies)"],
      ["Yearly", "Booster"],
    ];

    const dogDeworming = [
      ["2–8 weeks", "Every 2 weeks"],
      ["2–6 months", "Monthly"],
      ["Adult dogs", "Every 3 months"],
    ];

    return {
      cat: {
        title: "Cat: Vaccination & Deworming Timeline",
        vaccinationNote: "FVRCP = Flu + viral diseases (must-have).",
        dewormingNote: "Indoor cats still need deworming. Parasites don’t care about your boundaries.",
        vaccinationRows: catVaccination,
        dewormingRows: catDeworming,
      },
      dog: {
        title: "Dog: Vaccination & Deworming Timeline",
        vaccinationNote: "DHPP = Distemper, Hepatitis, Parvo, Parainfluenza.",
        dewormingNote: "Adult dogs still need deworming on schedule.",
        vaccinationRows: dogVaccination,
        dewormingRows: dogDeworming,
      },
    };
  }, []);

  const active = petSpecies === "dog" ? data.dog : petSpecies === "cat" ? data.cat : null;

  const beginnerGuideItems = useMemo(
    () => [
      {
        n: "1",
        h: "Food (Don’t freestyle this)",
        bullets: [
          "Use commercial pet food (cat ≠ dog food)",
          "No spicy, salty, oily human food",
          "Fresh water always",
          "Overfeeding is a silent killer.",
        ],
      },
      {
        n: "2",
        h: "Hygiene",
        bullets: [
          "Cats: litter box daily clean",
          "Dogs: regular bathing (not too frequent)",
          "Check ears, eyes, teeth weekly",
          "Dirty ears often lead to infection.",
        ],
      },
      {
        n: "3",
        h: "Weight & Activity",
        bullets: [
          "Feel ribs monthly (not see them, not buried under fat)",
          "Cats: play daily",
          "Dogs: walk daily",
          "Lazy pet ≠ calm pet. Often sick or bored.",
        ],
      },
      {
        n: "4",
        h: "Parasite Control",
        bullets: [
          "Deworm on schedule",
          "Flea/tick meds if outdoor exposure",
          "Don’t skip because “looks fine”",
          "Parasites work quietly.",
        ],
      },
      {
        n: "5",
        h: "When to See a Vet",
        bullets: [
          "Not eating >24 hours (cats especially)",
          "Fever, vomiting, diarrhea",
          "Difficulty breathing",
          "Straining to pee/poop",
          "Delay = regret.",
        ],
      },
    ],
    []
  );

  const ageInMonths = (iso) => {
    if (!iso) return null;
    const b = new Date(iso);
    if (Number.isNaN(b.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - b.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
  };

  const catEssentialsBase = useMemo(
    () => [
      { title: "Feeding", tip: "Kittens 3×→2×; Adults 2×" },
      { title: "Hydration", tip: "Fresh water / fountain" },
      { title: "Litter", tip: "+1 box rule, scoop daily" },
      { title: "Play", tip: "2–3 short sessions/day" },
      { title: "Dental", tip: "Brush daily or 3–4×/wk" },
      { title: "Parasites", tip: "Deworm & preventives" },
    ],
    []
  );

  const catToxicBase = useMemo(
    () => [
      "Chocolate",
      "Onion/Garlic",
      "Grapes/Raisins",
      "Xylitol",
      "Alcohol",
      "Caffeine",
      "Unbaked dough",
      "Lilies (very toxic)",
    ],
    []
  );

  const { catEssentials, catToxic, catToxicNote } = useMemo(() => {
    const sum = currentPetSummary;
    if (!sum?.pet) {
      return { catEssentials: null, catToxic: null, catToxicNote: null };
    }
    const months = ageInMonths(sum.pet.birthdate);
    const activeDiseases = (sum.diseases?.active || []).map((d) => String(d.disease_name || "").toLowerCase());
    const hasFeverVomiting = activeDiseases.some((n) => /fever|flu|vomit|gastro|diarrh/.test(n));
    const isKitten = months != null && months <= 12;
    const isSenior = months != null && months >= 120;

    const essentials = [
      {
        title: "Hydration",
        tip: hasFeverVomiting
          ? "Fresh water in 2–3 spots + wet food; monitor intake"
          : "Fresh water / fountain",
      },
      {
        title: "Feeding",
        tip: isKitten
          ? "Kittens 3×→2×; wet+dry balanced"
          : isSenior
            ? "Adults/Seniors 2×; easy-to-chew; portion control"
            : "Adults 2×; portion control",
      },
      { title: "Litter", tip: "+1 box rule, scoop daily" },
      { title: "Play", tip: "2–3 short sessions/day" },
      {
        title: "Dental",
        tip: isSenior
          ? "Brush 3–4×/wk; vet check if tartar"
          : "Brush daily or 3–4×/wk",
      },
      { title: "Parasites", tip: "Cat-safe preventives only; deworm as scheduled" },
    ];

    const extraToxic = [
      "Human painkillers (paracetamol/ibuprofen)",
      "Essential oils (tea tree, eucalyptus)",
      "Permethrin (dog spot-ons) — toxic to cats",
    ];
    const toxic = Array.from(new Set([...extraToxic, ...catToxicBase]));

    return {
      catEssentials: essentials,
      catToxic: toxic,
      catToxicNote: hasFeverVomiting ? "Hydration first this week — avoid new treats; no human meds." : null,
    };
  }, [currentPetSummary, catToxicBase]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden pt-8">
        <div className="max-w-6xl mx-auto px-4 mt-24">
          <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-lg p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500">{t("Guide")}</div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {t("Vaccination, deworming, and beginner care")} <span aria-hidden="true">🗓️</span>
                </h1>
                <p className="mt-1 text-slate-600">
                  {currentPet?.name
                    ? t("Showing recommendations for") + ` ${currentPet.name}`
                    : t("Pick a pet to personalize this guide.")}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6">
              {active ? (
                <section>
                  <h2 className="text-lg md:text-xl font-bold">{t(active.title)}</h2>

                  <div className="mt-3 grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">
                        {t("Vaccination (Core)")} <span aria-hidden="true">💉</span>
                      </h3>
                      <SimpleTable
                        columns={[t("Age"), t("Vaccine")]}
                        rows={active.vaccinationRows.map((r) => [t(r[0]), t(r[1])])}
                      />
                      <p className="mt-2 text-sm text-slate-600">{t(active.vaccinationNote)}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">
                        {t("Deworming")} <span aria-hidden="true">🪱</span>
                      </h3>
                      <SimpleTable
                        columns={[t("Age"), t("Schedule")]}
                        rows={active.dewormingRows.map((r) => [t(r[0]), t(r[1])])}
                      />
                      <p className="mt-2 text-sm text-slate-600">{t(active.dewormingNote)}</p>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-slate-100 bg-white/90 p-5">
                  <h2 className="text-lg font-bold">{t("Vaccination & deworming")}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {t("Select a pet (with species) to show the correct timeline.")}
                  </p>
                </section>
              )}

              <section className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-6">
                <h2 className="text-lg md:text-xl font-bold">
                  {t("Beginner Pet Care Guide")} <span aria-hidden="true">📘</span>
                </h2>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  {beginnerGuideItems.map((x) => (
                    <div key={x.n} className="rounded-2xl border border-slate-100 bg-[#fffef7] p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#fdd142] text-black grid place-items-center font-extrabold">
                          {x.n}
                        </div>
                        <div className="font-semibold">{t(x.h)}</div>
                      </div>
                      <ul className="mt-3 text-sm text-slate-700 list-disc pl-5 space-y-1">
                        {x.bullets.map((b) => (
                          <li key={b}>{t(b)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {(petSpecies === "cat" || !petSpecies) && (
                <section className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-6">
                  <h2 className="text-lg md:text-xl font-bold">
                    {t("Essentials")} <span aria-hidden="true">✅</span>
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{t("Small habits, big impact")}</p>
                  <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(catEssentials || catEssentialsBase).map((e) => (
                      <article
                        key={e.title}
                        className="bg-white/90 border border-white rounded-2xl shadow p-5 hover:shadow-lg transition"
                        aria-label={t("Essential card")}
                      >
                        <h3 className="font-bold">{t(e.title)}</h3>
                        <p className="text-sm text-slate-700 mt-1">{t(e.tip)}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {(petSpecies === "cat" || !petSpecies) && (
                <section className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-6">
                  <h2 className="text-lg md:text-xl font-bold">
                    {t("Toxic to Cats")} <span aria-hidden="true">⚠️</span>
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">{t("Keep these away—seek help if exposed")}</p>
                  <div className="mt-4 flex flex-wrap gap-2" aria-label={t("Toxic items list")}
                  >
                    {(catToxic || catToxicBase).map((tox) => (
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
                  {catToxicNote && (
                    <p className="mt-2 text-xs text-slate-600">{catToxicNote}</p>
                  )}
                  <a
                    href="tel:+18884264435"
                    className="inline-flex items-center gap-2 mt-4 rounded-full bg-[#0f172a] text-[#edfdfd] px-4 py-2 text-sm font-semibold shadow hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
                    aria-label={t("Call ASPCA Poison Control")}
                  >
                    {t("ASPCA Poison Control")} 888-426-4435
                  </a>
                </section>
              )}

              <p className="text-xs text-slate-500">
                {t("Note: Timelines vary by region and risk; confirm boosters with your vet.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
