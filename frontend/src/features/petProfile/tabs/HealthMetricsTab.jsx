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
    measured_at: "",
    weight_kg: "",
    body_temp_c: "",
    heart_rate_bpm: "",
    respiration_rate_bpm: "",
    gum_color: "pink",
    body_condition_score: "",
    coat_skin: "",
    appetite_state: "",
    water_intake_state: "",
    urine_frequency: "",
    clump_size: "",
    stool_consistency: "",
    blood_in_stool: false,
    straining_to_pee: false,
    no_poop_48h: false,
    note: ""
  });

  React.useEffect(() => {
    setForm((f) => ({ ...f, weight_kg: latestWeight ?? "", body_temp_c: latestTemp ?? "" }));
  }, [pet?.id, latestWeight, latestTemp]);

  const onChange = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));
  const onBool = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.checked }));

  const save = async () => {
    if (!token || !pet?.id) return;
    setSaving(true);
    
    const metricData = {
      pet_id: pet.id,
      measured_at: form.measured_at ? new Date(form.measured_at).toISOString() : new Date().toISOString(),
      weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      body_temp_c: form.body_temp_c === "" ? null : Number(form.body_temp_c),
      heart_rate_bpm: form.heart_rate_bpm === "" ? null : Number(form.heart_rate_bpm),
      respiration_rate_bpm: form.respiration_rate_bpm === "" ? null : Number(form.respiration_rate_bpm),
      gum_color: form.gum_color || null,
      body_condition_score: form.body_condition_score === "" ? null : Number(form.body_condition_score),
      coat_skin: form.coat_skin || null,
      appetite_state: form.appetite_state || null,
      water_intake_state: form.water_intake_state || null,
      urine_frequency: form.urine_frequency || null,
      clump_size: form.clump_size || null,
      stool_consistency: form.stool_consistency || null,
      blood_in_stool: form.blood_in_stool,
      straining_to_pee: form.straining_to_pee,
      no_poop_48h: form.no_poop_48h,
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
        measured_at: "",
        weight_kg: "",
        body_temp_c: "",
        heart_rate_bpm: "",
        respiration_rate_bpm: "",
        gum_color: "pink",
        body_condition_score: "",
        coat_skin: "",
        appetite_state: "",
        water_intake_state: "",
        urine_frequency: "",
        clump_size: "",
        stool_consistency: "",
        blood_in_stool: false,
        straining_to_pee: false,
        no_poop_48h: false,
        note: ""
      });
    } catch (e) {
      alert(e.message || "Failed to save metric");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="p-4 bg-white/80 border border-white rounded-2xl shadow">
      <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Measured at</label>
          <input type="datetime-local" value={form.measured_at} onChange={onChange('measured_at')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Weight (kg)</label>
          <input type="number" step="0.01" value={form.weight_kg} onChange={onChange('weight_kg')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Weight (kg)" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Body temp (°C)</label>
          <input type="number" step="0.1" value={form.body_temp_c} onChange={onChange('body_temp_c')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Temp (°C)" />
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-3 gap-3 mt-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Gum color</label>
          <select value={form.gum_color} onChange={onChange('gum_color')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
            <option value="pink">Pink (healthy)</option>
            <option value="pale_white">Pale / white</option>
            <option value="blue_gray">Blue / gray (emergency)</option>
            <option value="yellow">Yellow (liver)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Body Condition Score (1-9)</label>
          <select value={form.body_condition_score} onChange={onChange('body_condition_score')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
            <option value="">Select</option>
            {Array.from({ length: 9 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Coat & skin</label>
          <select value={form.coat_skin} onChange={onChange('coat_skin')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
            <option value="">Select</option>
            <option value="shiny">Shiny / normal</option>
            <option value="dull">Dull</option>
            <option value="shedding">Excess shedding</option>
            <option value="bald_spots">Bald spots</option>
            <option value="dandruff">Dandruff</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-3 gap-3 mt-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Appetite</label>
          <select value={form.appetite_state} onChange={onChange('appetite_state')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
            <option value="">Select</option>
            <option value="normal">Normal</option>
            <option value="decreased">Decreased</option>
            <option value="increased">Increased</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Water intake</label>
          <select value={form.water_intake_state} onChange={onChange('water_intake_state')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
            <option value="">Select</option>
            <option value="normal">Normal</option>
            <option value="decreased">Less than normal</option>
            <option value="increased">Drinking more</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Heart rate (bpm)</label>
          <input type="number" value={form.heart_rate_bpm} onChange={onChange('heart_rate_bpm')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Heart rate" />
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-3 gap-3 mt-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Respiration rate (bpm)</label>
          <input type="number" value={form.respiration_rate_bpm} onChange={onChange('respiration_rate_bpm')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Resp rate" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Urine frequency</label>
          <select value={form.urine_frequency} onChange={onChange('urine_frequency')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
            <option value="">Select</option>
            <option value="low">Less than normal</option>
            <option value="normal">Normal</option>
            <option value="high">More than normal</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Clump size</label>
          <select value={form.clump_size} onChange={onChange('clump_size')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
            <option value="">Select</option>
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Note</label>
          <textarea value={form.note} onChange={onChange('note')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Optional note" rows={4} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">Flags</label>
          <div className="flex flex-col gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white/80">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.blood_in_stool} onChange={onBool('blood_in_stool')} />
              Blood seen
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.straining_to_pee} onChange={onBool('straining_to_pee')} />
              Straining to pee (emergency)
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.no_poop_48h} onChange={onBool('no_poop_48h')} />
              No poop &gt; 48h
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-600">Stool consistency</label>
        <select value={form.stool_consistency} onChange={onChange('stool_consistency')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
          <option value="">Select</option>
          <option value="normal">Normal</option>
          <option value="diarrhea">Diarrhea</option>
          <option value="constipation">Constipation</option>
        </select>
      </div>
      <div className="mt-4 flex gap-2 items-center">
        <button 
          onClick={save} 
          disabled={saving} 
          className="px-4 py-2 rounded-full bg-[#0f172a] text-[#edfdfd] text-sm font-semibold disabled:opacity-60 flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
        >
          {saving ? "Saving..." : "Add metric"}
        </button>
        <span className="text-xs text-slate-500">Quick selectors focus on critical signals.</span>
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
                <div className="text-sm">Weight: {m.weight_kg ?? "—"} kg · Temp: {m.body_temp_c ?? "—"} °C</div>
                <div className="text-xs text-slate-600 mt-1">Gums: {m.gum_color || "—"} · BCS: {m.body_condition_score || "—"} · Coat: {m.coat_skin || "—"}</div>
                <div className="text-xs text-slate-600">Appetite: {m.appetite_state || "—"} · Water: {m.water_intake_state || "—"}</div>
                <div className="text-xs text-slate-600">Litter: urine {m.urine_frequency || "—"} / clump {m.clump_size || "—"} / stool {m.stool_consistency || "—"}</div>
                {(m.straining_to_pee || m.no_poop_48h || m.blood_in_stool) && (
                  <div className="text-xs text-rose-600 font-semibold">
                    {(m.straining_to_pee ? "Straining to pee · " : "")}
                    {(m.no_poop_48h ? "No poop >48h · " : "")}
                    {(m.blood_in_stool ? "Blood seen" : "")}
                  </div>
                )}
                {m.note ? <div className="text-xs text-slate-700 mt-1">{m.note}</div> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}