import React from "react";

export default function OverviewTab({ pet, summary }) {
  const latestWeight = summary?.metrics?.latestWeightKg ?? pet?.weight_kg ?? null;
  const latestTemp = summary?.metrics?.latestTempC ?? null;
  const trend = summary?.metrics?.trend ?? [];
  const activeDiseases = summary?.diseases?.active ?? [];
  const recentVaccines = summary?.vaccinations?.recent ?? [];
  const recentDeworm = summary?.dewormings?.recent ?? [];

  return (
    <section className="p-4 bg-white/80 border border-white rounded-2xl shadow">
      <div className="flex items-center gap-4">
        <img
          src={pet.avatar_url || "/placeholder.png"}
          alt={pet.name}
          className="w-16 h-16 rounded-xl object-cover border border-slate-200"
        />
        <div>
          <div className="text-xl font-semibold">{pet.name}</div>
          <div className="text-sm text-slate-600">
            {pet.species || "—"} · {pet.breed || "—"} · {pet.sex || "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Weight: {latestWeight ?? "—"} kg · Temp: {latestTemp ?? "—"} °C
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-white border border-slate-100 rounded-xl">
          <div className="text-xs text-slate-500">Active diseases</div>
          <div className="text-lg font-semibold">{activeDiseases.length}</div>
        </div>
        <div className="p-3 bg-white border border-slate-100 rounded-xl">
          <div className="text-xs text-slate-500">Recent vaccines</div>
          <div className="text-lg font-semibold">{recentVaccines?.length ?? 0}</div>
        </div>
        <div className="p-3 bg-white border border-slate-100 rounded-xl">
          <div className="text-xs text-slate-500">Recent deworming</div>
          <div className="text-lg font-semibold">{recentDeworm?.length ?? 0}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium mb-2">Recent measurements</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {trend.length === 0 ? (
            <div className="text-sm text-slate-500">No recent metrics.</div>
          ) : (
            trend.map((m, idx) => (
              <div key={m.id ?? m.measured_at ?? idx} className="p-3 bg-white border border-slate-100 rounded-xl">
                <div className="text-xs text-slate-500">{new Date(m.measured_at).toLocaleString()}</div>
                <div className="text-sm">Weight: {m.weight_kg ?? "—"} kg</div>
                <div className="text-sm">Temp: {m.body_temp_c ?? "—"} °C</div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}