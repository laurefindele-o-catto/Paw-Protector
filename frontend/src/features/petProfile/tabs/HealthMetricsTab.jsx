import React from "react";
import { useAuth } from "../../../context/AuthContext";
import apiConfig from "../../../config/apiConfig";

export default function HealthMetricsTab({ pet, summary, onSaved }) {
  const { token } = useAuth();
  const trend = summary?.metrics?.trend ?? [];
  const latestWeight = summary?.metrics?.latestWeightKg ?? pet?.weight_kg ?? "";
  const latestTemp = summary?.metrics?.latestTempC ?? "";

  const [saving, setSaving] = React.useState(false);
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
          </button>
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