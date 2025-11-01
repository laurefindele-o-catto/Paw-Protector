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

  // Extract summary data
  const summary = currentPetSummary;
  const latestWeight = summary?.metrics?.latestWeightKg ?? null;
  const latestTemp = summary?.metrics?.latestTempC ?? null;
  const trend = summary?.metrics?.trend || [];
  const lastCheck = trend?.[0]?.measured_at || null;

  const activeDiseases = summary?.diseases?.active || [];
  const activeCnt = activeDiseases.length;
  const activeNames = activeDiseases.map(d => d.disease_name).slice(0, 3);

  const nextVac = summary?.vaccinations?.nextDue || null;
  const nextVacDays = nextVac ? daysUntil(nextVac.due_on) : null;

  const nextDew = summary?.dewormings?.nextDue || null;
  const nextDewDays = nextDew ? daysUntil(nextDew.due_on) : null;

  return (
    <div className="w-full flex flex-col items-center justify-center text-center gap-2 my-2">
      {/* Pet Switcher Controls */}
      <div className="flex items-center gap-2">
        {pets.length > 0 ? (
          <div className="gap-x-6 flex flex-row">
            <div>
              <label className="text-xs text-slate-600 mr-4">Current Pet</label>
              <select
                value={currentPetId || ""}
                onChange={(e) => selectPet(parseInt(e.target.value, 10))}
                className="border border-slate-300 rounded-full px-3 py-1 text-sm bg-white/80"
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
              className="text-sm font-medium bg-[#0f172a] text-[#edfdfd] px-3 py-1 rounded-full hover:bg-slate-900 transition"
            >
              + Add another one
            </Link>
          </div>
        ) : (
          <Link
            to="/addPet"
            className="text-sm font-medium bg-[#0f172a] text-[#edfdfd] px-3 py-1 rounded-full hover:bg-slate-900 transition"
          >
            + Add your first pet
          </Link>
        )}
      </div>

      {/* Current Pet Card */}
      {currentPet && (
        <>
          <div className="mt-3 w-[70%] bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-4 text-center items-center justify-center">
            <div className="flex items-center gap-4">
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
                <div className="bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-4 flex flex-col">
                  <div className="text-xs text-slate-500">Illness</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{activeCnt}</div>
                  <div className="text-xs text-slate-500">Active</div>
                  <div className="mt-2 text-sm text-slate-700 truncate">
                    {activeCnt > 0 ? activeNames.join(', ') : 'None'}
                  </div>
                </div>

                {/* Vaccination Card */}
                <div className="bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-4 flex flex-col">
                  <div className="text-xs text-slate-500">Vaccination</div>
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
                <div className="bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-4 flex flex-col">
                  <div className="text-xs text-slate-500">Deworming</div>
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
    </div>
  );
}