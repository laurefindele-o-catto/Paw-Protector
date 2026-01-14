import React from "react";
import { Link } from "react-router-dom";
import { usePet } from "../context/PetContext";

const placeholder = "/placeholder.png";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const due = new Date(dateStr);
  const start = new Date(today.toDateString());
  return Math.ceil((due - start) / (1000 * 60 * 60 * 24));
}

export default function PetSwitcher() {
  const { pets, currentPet, currentPetId, selectPet, currentPetSummary } = usePet();
  const [showDiseaseInfo, setShowDiseaseInfo] = React.useState(false);
  const [showVaccineInfo, setShowVaccineInfo] = React.useState(false);
  const [showDewormInfo, setShowDewormInfo] = React.useState(false);
  const openHealthify = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-healthify'));
  }, []);

  // Extract summary data
  const summary = currentPetSummary;
  const latestWeight = summary?.metrics?.latestWeightKg ?? currentPet?.weight_kg ?? null;
  const latestTemp = summary?.metrics?.latestTempC ?? null;
  const trend = summary?.metrics?.trend || [];
  const lastCheck = trend?.[0]?.measured_at || null;

  const allDiseases = summary?.diseases?.all || [
    ...(summary?.diseases?.active || []),
    ...(summary?.diseases?.resolved || []),
  ];
  const activeDiseases = summary?.diseases?.active || [];
  const activeCnt = activeDiseases.length;
  const activeNames = activeDiseases.map(d => d.disease_name).slice(0, 3);

  const vaccinesRecent = summary?.vaccinations?.recent || [];
  const dewormRecent = summary?.dewormings?.recent || [];

  const nextVac = summary?.vaccinations?.nextDue || summary?.vaccinations?.recent[0];
  const nextVacDays = nextVac ? daysUntil(nextVac.due_on) : null;

  const nextDew = summary?.dewormings?.nextDue || null;
  const nextDewDays = nextDew ? daysUntil(nextDew.due_on) : null;

  return (
    <div className="w-full flex flex-col items-center justify-center text-center gap-2">
      {/* Pet Switcher Controls */}
      <div className="flex items-center gap-2">
        {pets.length > 0 ? (
          <div className="gap-x-6 flex flex-row items-center">
            <div>
              <label className="text-xs text-slate-600 mr-4">Current Pet</label>
              <select
                value={currentPetId || ""}
                onChange={(e) => selectPet(parseInt(e.target.value, 10))}
                className="border border-slate-300 rounded-full px-3 py-1 text-sm bg-white/80 focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
                title="Switch pet"
              >
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <Link
              to="/addPet"
              className="text-sm font-medium bg-[#0f172a] text-[#edfdfd] px-3 py-1 rounded-full hover:bg-slate-900 transition focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
            >
              + Add another one
            </Link>
          </div>
        ) : (
          <div className="my-8">
            <Link
            to="/addPet"
            className="text-sm font-medium bg-[#0f172a] text-[#edfdfd] px-3 py-1 rounded-full hover:bg-slate-900 transition focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
          >
            + Add your first pet
          </Link>
          </div>
        )}
      </div>

      {/* Current Pet Card */}
      {currentPet && (
        <>
          <div className="mt-3 w-[70%] bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-4 text-left">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={currentPet.avatar_url || placeholder}
                  alt={currentPet.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                />
                <div className="min-w-0">
                  <div className="text-lg font-semibold text-slate-900 truncate">
                    {currentPet.name}
                  </div>
                  <div className="text-sm text-slate-600 truncate">
                    {currentPet.species || "—"} · {currentPet.breed || "—"} · {currentPet.sex || "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Weight: {currentPet.weight_kg ?? "—"} kg
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700 shrink-0">
                <span className="font-medium whitespace-nowrap">Quickly add today&apos;s health metrics</span>
                <button
                  type="button"
                  onClick={openHealthify}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#0f172a] text-[#edfdfd] hover:bg-slate-900 transition focus:outline-none focus:ring-2 focus:ring-[#fdd142] focus:ring-offset-2"
                >
                  Healthify
                </button>
              </div>
            </div>
            {/* Pet Summary Cards */}
            {!summary ? (
              <div className="mt-3 w-full grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white/60 border border-white rounded-2xl shadow p-4 animate-pulse">
                    <div className="h-3 w-16 bg-slate-200 rounded mb-3" />
                    <div className="h-6 w-20 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 w-full grid grid-cols-4 gap-4">
                {/* Health Card */}
                <div className="bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-4 flex flex-col">
                  <div className="text-xs text-slate-500">Health</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{latestWeight ?? '—'} kg</div>
                  <div className="text-xs text-slate-500">Last weight</div>
                  <div className="mt-2 text-sm text-slate-700">Temp: {latestTemp ?? '—'} °C</div>
                  <div className="text-[11px] text-slate-500 mt-1">Last check: {lastCheck ? new Date(lastCheck).toLocaleDateString() : '—'}</div>
                </div>

                {/* Illness Card */}
                <div className="relative bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-4 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="text-xs text-slate-500">Illness</div>
                    <button
                      type="button"
                      onClick={() => setShowDiseaseInfo(true)}
                      className="text-xl text-slate-500 hover:text-slate-800"
                      aria-label="View illness details"
                    >
                      ⓘ
                    </button>
                  </div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{activeCnt}</div>
                  <div className="text-xs text-slate-500">Active</div>
                  <div className="mt-2 text-sm text-slate-700 truncate">
                    {activeCnt > 0 ? activeNames.join(', ') : 'None'}
                  </div>
                </div>

                {/* Vaccination Card */}
                <div className="relative bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-4 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="text-xs text-slate-500">Vaccination</div>
                    <button
                      type="button"
                      onClick={() => setShowVaccineInfo(true)}
                      className="text-xl text-slate-500 hover:text-slate-800"
                      aria-label="View vaccine details"
                    >
                      ⓘ
                    </button>
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {nextVac?.vaccine_name ? nextVac.vaccine_name : '—'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Due: {nextVac?.due_on ? new Date(nextVac.due_on).toLocaleDateString() : '—'}
                  </div>
                  <div className={`mt-2 text-sm ${nextVacDays != null && nextVacDays <= 7 ? 'text-red-600' : 'text-slate-700'}`}>
                    {nextVacDays != null ? `${nextVacDays} day(s)` : 'No schedule'}
                  </div>
                </div>

                {/* Deworming Card */}
                <div className="relative bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-4 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="text-xs text-slate-500">Deworming</div>
                    <button
                      type="button"
                      onClick={() => setShowDewormInfo(true)}
                      className="text-xl text-slate-500 hover:text-slate-800"
                      aria-label="View deworming details"
                    >
                      ⓘ
                    </button>
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {nextDew?.product_name ? nextDew.product_name : '—'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Due: {nextDew?.due_on ? new Date(nextDew.due_on).toLocaleDateString() : '—'}
                  </div>
                  <div className={`mt-2 text-sm ${nextDewDays != null && nextDewDays <= 7 ? 'text-red-600' : 'text-slate-700'}`}>
                    {nextDewDays != null ? `${nextDewDays} day(s)` : 'No schedule'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Illness detail modal */}
      {showDiseaseInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowDiseaseInfo(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-5 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Illness history</div>
              <button onClick={() => setShowDiseaseInfo(false)} className="text-sm text-slate-500 hover:text-slate-800">Close</button>
            </div>
            {allDiseases.length === 0 ? (
              <div className="text-sm text-slate-600">No illness recorded.</div>
            ) : (
              <div className="space-y-2">
                {allDiseases.map((d, idx) => (
                  <div key={d.id || idx} className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-900">{d.disease_name || 'Unnamed'}</div>
                      <div className="text-xs text-slate-500">{d.status ? d.status.toUpperCase() : '—'}</div>
                    </div>
                    <div className="text-sm text-slate-700 mt-1">Symptoms: {d.symptoms || '—'}</div>
                    <div className="text-sm text-slate-700">Severity: {d.severity || '—'}</div>
                    <div className="text-xs text-slate-500 mt-1">Diagnosed: {d.diagnosed_on ? new Date(d.diagnosed_on).toLocaleDateString() : '—'}{d.resolved_on ? ` · Resolved: ${new Date(d.resolved_on).toLocaleDateString()}` : ''}</div>
                    {d.notes ? <div className="text-xs text-slate-600 mt-1">Notes: {d.notes}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vaccine detail modal */}
      {showVaccineInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowVaccineInfo(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-5 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Vaccination history</div>
              <button onClick={() => setShowVaccineInfo(false)} className="text-sm text-slate-500 hover:text-slate-800">Close</button>
            </div>
            {vaccinesRecent.length === 0 ? (
              <div className="text-sm text-slate-600">No vaccinations recorded.</div>
            ) : (
              <div className="space-y-2">
                {vaccinesRecent.map((v, idx) => (
                  <div key={v.id || idx} className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-900">{v.vaccine_name || 'Vaccine'}</div>
                      <div className="text-xs text-slate-500">Dose: {v.dose || '—'}</div>
                    </div>
                    <div className="text-sm text-slate-700">Administered: {v.administered_on ? new Date(v.administered_on).toLocaleDateString() : '—'}</div>
                    <div className="text-sm text-slate-700">Due: {v.due_on ? new Date(v.due_on).toLocaleDateString() : '—'}</div>
                    {v.notes ? <div className="text-xs text-slate-600 mt-1">Notes: {v.notes}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deworming detail modal */}
      {showDewormInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowDewormInfo(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-5 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Deworming history</div>
              <button onClick={() => setShowDewormInfo(false)} className="text-sm text-slate-500 hover:text-slate-800">Close</button>
            </div>
            {dewormRecent.length === 0 ? (
              <div className="text-sm text-slate-600">No deworming recorded.</div>
            ) : (
              <div className="space-y-2">
                {dewormRecent.map((d, idx) => (
                  <div key={d.id || idx} className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-slate-900">{d.product_name || 'Deworming'}</div>
                      <div className="text-xs text-slate-500">Batch: {d.batch || '—'}</div>
                    </div>
                    <div className="text-sm text-slate-700">Administered: {d.administered_on ? new Date(d.administered_on).toLocaleDateString() : '—'}</div>
                    <div className="text-sm text-slate-700">Due: {d.due_on ? new Date(d.due_on).toLocaleDateString() : '—'}</div>
                    {d.notes ? <div className="text-xs text-slate-600 mt-1">Notes: {d.notes}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}