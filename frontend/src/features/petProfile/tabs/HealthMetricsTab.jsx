import React from "react";
import { useAuth } from "../../../context/AuthContext";
import apiConfig from "../../../config/apiConfig";
import { queueAddMetric } from "../../../services/syncService";

export default function HealthMetricsTab({ pet, summary, onSaved }) {
  const { token } = useAuth();
  const trend = summary?.metrics?.trend ?? [];
  const latestWeight = summary?.metrics?.latestWeightKg ?? pet?.weight_kg ?? "";
  const latestTemp = summary?.metrics?.latestTempC ?? "";

  const [saving, setSaving] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [form, setForm] = React.useState({
    measured_at: "", weight_kg: "", body_temp_c: "", heart_rate_bpm: "", respiration_rate_bpm: "", note: ""
  });

  React.useEffect(() => {
    setForm((f) => ({ ...f, weight_kg: latestWeight ?? "", body_temp_c: latestTemp ?? "" }));
  }, [pet?.id, latestWeight, latestTemp]);

  const onChange = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));

  const save = async () => {
    if (!token || !pet?.id) return;
    setSaving(true);
    
    const metricData = {
      pet_id: pet.id,
      measured_at: form.measured_at || new Date().toISOString(),
      weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      body_temp_c: form.body_temp_c === "" ? null : Number(form.body_temp_c),
      heart_rate_bpm: form.heart_rate_bpm === "" ? null : Number(form.heart_rate_bpm),
      respiration_rate_bpm: form.respiration_rate_bpm === "" ? null : Number(form.respiration_rate_bpm),
      note: form.note || null
    };
    
    try {
      if (!navigator.onLine) {
        // Queue for sync when offline
        setSyncing(true);
        await queueAddMetric(metricData);
        onSaved?.();
        alert('Metric saved locally and will sync when online');
        // Reset form
        setForm({
          measured_at: "", weight_kg: "", body_temp_c: "", heart_rate_bpm: "", respiration_rate_bpm: "", note: ""
        });
        return;
      }
      
      // Online - send to server
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.pets.metrics.add(pet.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(metricData)
      });
      
      if (!res.ok) throw new Error("Failed to save metric");
      onSaved?.();
      // Reset form
      setForm({
        measured_at: "", weight_kg: "", body_temp_c: "", heart_rate_bpm: "", respiration_rate_bpm: "", note: ""
      });
    } catch (e) {
      alert(e.message || "Failed to save metric");
    } finally {
      setSaving(false);
      setSyncing(false);
    }
  };

  return (
    <section className="p-4 bg-white/80 border border-white rounded-2xl shadow">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">measured_at</label>
          <input type="date" value={form.measured_at} onChange={onChange('measured_at')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">weight_kg</label>
          <input type="number" step="0.01" value={form.weight_kg} onChange={onChange('weight_kg')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Weight (kg)" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">body_temp_c</label>
          <input type="number" step="0.1" value={form.body_temp_c} onChange={onChange('body_temp_c')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Temp (°C)" />
        </div>
        {/* <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">heart_rate_bpm</label>
          <input type="number" value={form.heart_rate_bpm} onChange={onChange('heart_rate_bpm')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Heart rate (bpm)" />
        </div> */}
        {/* <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">respiration_rate_bpm</label>
          <input type="number" value={form.respiration_rate_bpm} onChange={onChange('respiration_rate_bpm')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Resp rate (bpm)" />
        </div> */}
        <div className="flex flex-col gap-1 md:col-span-3">
          <label className="text-xs text-slate-600">note</label>
          <input value={form.note} onChange={onChange('note')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Note" />
        </div>
        <div className="md:col-span-3 flex gap-2 items-center">
          <button 
            onClick={save} 
            disabled={saving} 
            className="px-4 py-2 rounded-full bg-[#0f172a] text-[#edfdfd] text-sm font-semibold disabled:opacity-60 flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
          >
            {saving ? "Saving..." : "Add metric"}
            {syncing && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            )}
          </button>
          {syncing && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Pending sync
            </span>
          )}
        </div>
      </div>

      <div className="mt-5">
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