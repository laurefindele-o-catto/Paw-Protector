import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import apiConfig from "../config/apiConfig";
import { useLanguage } from "../context/LanguageContext";
import { usePet } from "../context/PetContext";
import { useAuth } from "../context/AuthContext";
import { normalizeSpecies, VACCINE_ALL_OPTIONS_BY_SPECIES, VACCINE_CORE_BY_SPECIES } from "../constants/careCatalog";

const VaccineAlert = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const { pets, currentPetId, currentPet, selectPet } = usePet();

  const petSpecies = normalizeSpecies(currentPet?.species);
  const vaccineOptions = (petSpecies && VACCINE_ALL_OPTIONS_BY_SPECIES[petSpecies])
    ? VACCINE_ALL_OPTIONS_BY_SPECIES[petSpecies]
    : ["Rabies", "FVRCP", "DHPP", "FeLV", "Other"]; // fallback

  const [vaccinations, setVaccinations] = useState([]);
  const [dewormings, setDewormings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("overview"); // overview | history | add
  const [dueWindowDays, setDueWindowDays] = useState(30);
  const [filterText, setFilterText] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Add form
  const [entryType, setEntryType] = useState("vaccine");
  const [entryName, setEntryName] = useState("Rabies");
  const [administeredOn, setAdministeredOn] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const todayISO = new Date().toISOString().slice(0, 10);

  const parseISO = (iso) => {
    if (!iso) return null;
    const d = new Date(String(iso).slice(0, 10));
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const toISO = (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0, 10);
  };

  const addDaysISO = (iso, days) => {
    const base = parseISO(iso);
    if (!base) return null;
    const next = new Date(base);
    next.setDate(next.getDate() + Number(days || 0));
    return toISO(next);
  };

  const estimateDueOn = (type, administered) => {
    if (!administered) return null;
    const days = type === "deworm" ? 90 : 365;
    return addDaysISO(administered, days);
  };

  const computeDueOnForRecord = (type, rec) => {
    const rawDue = rec?.due_on ? String(rec.due_on).slice(0, 10) : null;
    if (rawDue) return rawDue;
    const admin = rec?.administered_on ? String(rec.administered_on).slice(0, 10) : null;
    return estimateDueOn(type, admin);
  };

  const fetchRecords = useCallback(
    async (petId) => {
      if (!token || !petId) return;
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [vacRes, dewRes] = await Promise.all([
          fetch(`${apiConfig.baseURL}/api/care/vaccinations/${petId}`, { headers }),
          fetch(`${apiConfig.baseURL}/api/care/dewormings/${petId}`, { headers }),
        ]);

        if (!vacRes.ok || !dewRes.ok) {
          throw new Error("Failed to load records");
        }

        const vacData = await vacRes.json();
        const dewData = await dewRes.json();

        setVaccinations(Array.isArray(vacData) ? vacData : vacData?.vaccinations || []);
        setDewormings(Array.isArray(dewData) ? dewData : dewData?.dewormings || []);
      } catch {
        setVaccinations([]);
        setDewormings([]);
        setError(t("Could not load vaccination/deworming data."));
      } finally {
        setLoading(false);
      }
    },
    [token, t]
  );

  useEffect(() => {
    if (!currentPetId) {
      setVaccinations([]);
      setDewormings([]);
      return;
    }
    fetchRecords(currentPetId);
  }, [currentPetId, fetchRecords]);

  const actionItems = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    const items = [];

    vaccinations.forEach((v) => {
      const due = computeDueOnForRecord("vaccine", v);
      if (!due) return;
      const status = due < todayISO ? "overdue" : null;
      const diff = (new Date(due) - new Date(todayISO)) / (1000 * 60 * 60 * 24);
      const dueSoon = status ? null : diff <= Number(dueWindowDays || 30);
      const finalStatus = status || (dueSoon ? "due" : null);
      if (!finalStatus) return;

      const name = v.vaccine_name || "Vaccine";
      if (query && !String(name).toLowerCase().includes(query)) return;

      items.push({
        id: `vaccine:${v.id}`,
        type: "vaccine",
        name,
        administered_on: v.administered_on ? String(v.administered_on).slice(0, 10) : null,
        due_on: due,
        status: finalStatus,
        notes: v.notes || null,
      });
    });

    dewormings.forEach((d) => {
      const due = computeDueOnForRecord("deworm", d);
      if (!due) return;
      const status = due < todayISO ? "overdue" : null;
      const diff = (new Date(due) - new Date(todayISO)) / (1000 * 60 * 60 * 24);
      const dueSoon = status ? null : diff <= Number(dueWindowDays || 30);
      const finalStatus = status || (dueSoon ? "due" : null);
      if (!finalStatus) return;

      const name = d.product_name || "Deworming";
      if (query && !String(name).toLowerCase().includes(query)) return;

      items.push({
        id: `deworm:${d.id}`,
        type: "deworm",
        name,
        administered_on: d.administered_on ? String(d.administered_on).slice(0, 10) : null,
        due_on: due,
        status: finalStatus,
        notes: d.notes || null,
      });
    });

    items.sort((a, b) => new Date(a.due_on) - new Date(b.due_on));
    return items;
  }, [vaccinations, dewormings, filterText, dueWindowDays, todayISO]);

  const overdue = actionItems.filter((i) => i.status === "overdue");
  const dueSoon = actionItems.filter((i) => i.status === "due");
  const nextItem = actionItems[0] || null;

  const historyRows = useMemo(() => {
    const rows = [];
    vaccinations.forEach((v) => {
      rows.push({
        id: `vaccine:${v.id}`,
        type: "Vaccine",
        name: v.vaccine_name || "—",
        administered_on: v.administered_on ? String(v.administered_on).slice(0, 10) : "—",
        due_on: computeDueOnForRecord("vaccine", v) || "—",
        notes: v.notes || "—",
      });
    });
    dewormings.forEach((d) => {
      rows.push({
        id: `deworm:${d.id}`,
        type: "Deworming",
        name: d.product_name || "—",
        administered_on: d.administered_on ? String(d.administered_on).slice(0, 10) : "—",
        due_on: computeDueOnForRecord("deworm", d) || "—",
        notes: d.notes || "—",
      });
    });
    rows.sort((a, b) => (a.due_on === "—" ? 1 : b.due_on === "—" ? -1 : new Date(a.due_on) - new Date(b.due_on)));
    return rows;
  }, [vaccinations, dewormings]);

  const onSave = async () => {
    if (!currentPetId || !token) return;
    if (!entryName) return;
    if (!administeredOn && !dueOn) return;

    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      if (entryType === "vaccine") {
        await fetch(`${apiConfig.baseURL}${apiConfig.care.addVaccination}`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            pet_id: currentPetId,
            vaccine_name: entryName,
            administered_on: administeredOn || null,
            due_on: dueOn || estimateDueOn("vaccine", administeredOn) || null,
            notes: notes || null,
          }),
        });
      } else {
        await fetch(`${apiConfig.baseURL}${apiConfig.care.addDeworming}`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            pet_id: currentPetId,
            product_name: entryName,
            administered_on: administeredOn || null,
            due_on: dueOn || estimateDueOn("deworm", administeredOn) || null,
            notes: notes || null,
          }),
        });
      }

      await fetchRecords(currentPetId);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      setNotes("");
      setAdministeredOn("");
      setDueOn("");
    } catch {
      setError(t("Save failed. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const statusPill = (status) => {
    if (status === "overdue") return "bg-red-50 text-red-700 border-red-200";
    if (status === "due") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <>
      <Header />
      <main id="main-content" role="main" tabIndex="-1">
        <div className="min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden mt-28">
          <div className="mx-auto max-w-6xl px-4 pt-8">
            <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-lg p-6 md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">{t("Vaccination Alerts")}</div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    {t("Vaccination & Deworming")}
                  </h1>
                  <p className="mt-1 text-slate-600">
                    {currentPet?.name
                      ? t("Alerts for") + ` ${currentPet.name}`
                      : t("Select a pet to see due items.")}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="min-w-60">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t("Pet")}</label>
                    <select
                      value={currentPetId || ""}
                      onChange={(e) => selectPet(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm text-sm"
                    >
                      {(pets || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.species})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-44">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t("Due window")}</label>
                    <select
                      value={dueWindowDays}
                      onChange={(e) => setDueWindowDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm text-sm"
                    >
                      <option value={7}>{t("Next 7 days")}</option>
                      <option value={14}>{t("Next 14 days")}</option>
                      <option value={30}>{t("Next 30 days")}</option>
                      <option value={60}>{t("Next 60 days")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { k: "overview", label: t("Overview") },
                  { k: "history", label: t("History") },
                  { k: "add", label: t("Add / Schedule") },
                ].map((x) => (
                  <button
                    key={x.k}
                    type="button"
                    onClick={() => setTab(x.k)}
                    className={
                      "px-4 py-2 rounded-full text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2 " +
                      (tab === x.k
                        ? "bg-[#0f172a] text-[#edfdfd] shadow"
                        : "bg-white border border-slate-200 text-[#0f172a] hover:bg-[#fdd142]/20")
                    }
                  >
                    {x.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading && (
                <div className="mt-4 text-sm text-slate-600">{t("Loading...")}</div>
              )}

              {/* Overview */}
              {tab === "overview" && (
                <div className="mt-6 grid gap-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white/90 border border-white rounded-2xl shadow p-5">
                      <div className="text-xs uppercase tracking-widest text-slate-500">{t("Overdue")}</div>
                      <div className="mt-1 text-3xl font-extrabold text-red-700">{overdue.length}</div>
                      <div className="mt-1 text-sm text-slate-600">{t("Items past due date")}</div>
                    </div>
                    <div className="bg-white/90 border border-white rounded-2xl shadow p-5">
                      <div className="text-xs uppercase tracking-widest text-slate-500">{t("Due Soon")}</div>
                      <div className="mt-1 text-3xl font-extrabold text-amber-700">{dueSoon.length}</div>
                      <div className="mt-1 text-sm text-slate-600">{t("Within selected window")}</div>
                    </div>
                    <div className="bg-white/90 border border-white rounded-2xl shadow p-5">
                      <div className="text-xs uppercase tracking-widest text-slate-500">{t("Next")}</div>
                      {nextItem ? (
                        <div className="mt-2">
                          <div className="font-bold">{t(nextItem.name)}</div>
                          <div className="text-sm text-slate-600">{t("Due")} {nextItem.due_on}</div>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-slate-600">{t("No upcoming alerts.")}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-lg font-bold">{t("Action items")}</div>
                      <div className="text-sm text-slate-600">{t("Click an item for details.")}</div>
                    </div>
                    <input
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder={t("Filter by name")}
                      className="w-full sm:w-[280px] px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm text-sm"
                    />
                  </div>

                  <div className="grid gap-3">
                    {actionItems.length ? (
                      actionItems.map((it) => {
                        const open = expandedId === it.id;
                        const badge = it.type === "vaccine" ? t("Vaccine") : t("Deworming");
                        return (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => setExpandedId(open ? null : it.id)}
                            className="text-left bg-white/90 border border-white rounded-2xl shadow p-5 hover:shadow-lg transition focus:outline-none focus:ring-4 focus:ring-[#fdd142]/60 focus:ring-offset-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${statusPill(it.status)}`}>
                                    {it.status === "overdue" ? t("Overdue") : t("Due soon")}
                                  </span>
                                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700">
                                    {badge}
                                  </span>
                                </div>
                                <div className="mt-2 font-bold text-slate-900">{t(it.name)}</div>
                                <div className="text-sm text-slate-600">{t("Due")} {it.due_on}</div>
                              </div>
                              <span className="text-slate-400 text-lg" aria-hidden="true">
                                {open ? "–" : "+"}
                              </span>
                            </div>

                            {open && (
                              <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-700 grid gap-1">
                                <div>
                                  <span className="text-slate-500">{t("Last administered")}:</span>{" "}
                                  <span className="font-semibold">{it.administered_on || t("Unknown")}</span>
                                </div>
                                {it.notes && (
                                  <div>
                                    <span className="text-slate-500">{t("Notes")}:</span>{" "}
                                    <span className="font-semibold">{t(it.notes)}</span>
                                  </div>
                                )}
                                <div className="text-xs text-slate-500 mt-1">
                                  {t("If due date is missing in older records, this page estimates next due as 1 year for vaccines and 3 months for deworming.")}
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 text-sm text-slate-600">
                        {t("No items match your filters.")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* History */}
              {tab === "history" && (
                <div className="mt-6">
                  <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-lg font-bold">{t("History")}</div>
                      <div className="text-sm text-slate-600">{t("Vaccines and deworming records (with due dates).")}</div>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 bg-white/90 shadow-sm">
                    <table className="min-w-[720px] w-full text-left">
                      <thead className="bg-[#fffef7]">
                        <tr>
                          {[t("Type"), t("Name"), t("Administered"), t("Due"), t("Notes")].map((h) => (
                            <th key={h} className="px-4 py-3 text-xs uppercase tracking-widest text-slate-600">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {historyRows.map((r, idx) => (
                          <tr key={r.id} className={idx % 2 ? "bg-white" : "bg-slate-50/60"}>
                            <td className="px-4 py-3 text-sm text-slate-800">{t(r.type)}</td>
                            <td className="px-4 py-3 text-sm text-slate-800 font-semibold">{t(r.name)}</td>
                            <td className="px-4 py-3 text-sm text-slate-800">{r.administered_on}</td>
                            <td className="px-4 py-3 text-sm text-slate-800">{r.due_on}</td>
                            <td className="px-4 py-3 text-sm text-slate-800">{t(r.notes)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Add */}
              {tab === "add" && (
                <div className="mt-6 grid gap-6">
                  <div className="bg-white/90 border border-white rounded-2xl shadow p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-lg font-bold">{t("Add / Schedule")}</div>
                        <div className="text-sm text-slate-600">{t("Record a dose or set a due date.")}</div>
                      </div>
                      {saved && (
                        <div className="px-3 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                          {t("Saved")}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t("Type")}</label>
                        <select
                          value={entryType}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEntryType(v);
                            setEntryName(v === "deworm" ? "Albendazole" : "Rabies");
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm text-sm"
                        >
                          <option value="vaccine">{t("Vaccine")}</option>
                          <option value="deworm">{t("Deworming")}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t("Name")}</label>
                        <select
                          value={entryName}
                          onChange={(e) => setEntryName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm text-sm"
                        >
                          {entryType === "vaccine" ? (
                            <>
                              {vaccineOptions.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </>
                          ) : (
                            <>
                              <option>Albendazole</option>
                              <option>Fenbendazole</option>
                              <option>Drontal</option>
                              <option>Other</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t("Administered on (optional)")}</label>
                        <input
                          type="date"
                          value={administeredOn}
                          onChange={(e) => setAdministeredOn(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm text-sm"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">{t("Due on (optional)")}</label>
                          <button
                            type="button"
                            onClick={() => {
                              const computed = estimateDueOn(entryType === "deworm" ? "deworm" : "vaccine", administeredOn);
                              if (computed) setDueOn(computed);
                            }}
                            className="text-xs font-semibold text-[#0f172a] hover:underline"
                            aria-label={t("Auto-calculate due date")}
                          >
                            {t("Auto-calc")}
                          </button>
                        </div>
                        <input
                          type="date"
                          value={dueOn}
                          onChange={(e) => setDueOn(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm text-sm"
                        />
                        <div className="mt-1 text-[11px] text-slate-500">
                          {t("If you leave Due empty, we estimate 1 year for vaccines and 3 months for deworming.")}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">{t("Notes (optional)")}</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full min-h-[88px] px-3 py-2 rounded-2xl border border-slate-200 bg-white shadow-sm text-sm"
                          placeholder={t("e.g., given at clinic, batch number, side effects")}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onSave}
                        disabled={saving || !currentPetId || (!administeredOn && !dueOn) || !entryName}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f172a] text-[#edfdfd] px-5 py-3 text-sm font-semibold shadow hover:bg-slate-900 transition disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
                      >
                        {saving ? t("Saving...") : t("Save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdministeredOn("");
                          setDueOn("");
                          setNotes("");
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold shadow-sm hover:shadow transition focus:outline-none focus:ring-4 focus:ring-[#fdd142]/60 focus:ring-offset-2"
                      >
                        {t("Clear")}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/90 border border-white rounded-2xl shadow p-6">
                    <div className="text-sm font-bold">{t("Recommended core vaccines")}</div>
                    <ul className="mt-3 list-disc list-inside text-sm text-slate-700 space-y-1">
                      {(petSpecies && VACCINE_CORE_BY_SPECIES[petSpecies]
                        ? VACCINE_CORE_BY_SPECIES[petSpecies]
                        : ["Rabies", "FVRCP", "DHPP", "FeLV"]) // fallback
                        .map((v) => (
                          <li key={v}>{v}</li>
                        ))}
                    </ul>
                    <p className="mt-3 text-xs text-slate-500">{t("Always confirm schedules and booster frequency with your veterinarian.")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default VaccineAlert;