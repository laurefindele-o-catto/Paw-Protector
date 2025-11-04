import React from "react";
import { useAuth } from "../../../context/AuthContext";
import apiConfig from "../../../config/apiConfig";

export default function DiseasesTab({ pet, summary, onChanged }) {
  const { token } = useAuth();
  const active = summary?.diseases?.active ?? [];
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    disease_name: "", symptoms: "", severity: "mild", status: "active", diagnosed_on: "", notes: ""
  });
  const onChange = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));

  const add = async () => {
    if (!token || !pet?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.pets.diseases.create(pet.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Failed to add disease");
      setForm({ disease_name: "", symptoms: "", severity: "mild", status: "active", diagnosed_on: "", notes: "" });
      onChanged?.();
    } catch (e) {
      alert(e.message || "Failed to add disease");
    } finally {
      setSaving(false);
    }
  };

  const resolve = async (id) => {
    if (!token || !id) return;
    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.pets.diseases.update(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "resolved", resolved_on: new Date().toISOString().slice(0,10) })
      });
      if (!res.ok) throw new Error("Failed to resolve disease");
      onChanged?.();
    } catch (e) {
      alert(e.message || "Failed to resolve disease");
    }
  };

  return (
    <section className="p-4 bg-white/80 border border-white rounded-2xl shadow">
      <div className="text-sm font-medium mb-2">Active diseases</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {active.length === 0 ? (
          <div className="text-sm text-slate-500">None</div>
        ) : active.map(d => (
          <div key={d.id} className="px-3 py-2 bg-white border border-slate-200 rounded-xl">
            <div className="text-sm font-semibold">{d.disease_name}</div>
            <div className="text-xs text-slate-600">{d.symptoms || "—"}</div>
            <div className="mt-1">
              <button onClick={()=>resolve(d.id)} className="text-xs px-2 py-1 rounded-full bg-slate-800 text-white">Mark resolved</button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm font-medium mb-2">Add disease</div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-slate-600">disease_name</label>
          <input value={form.disease_name} onChange={onChange('disease_name')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Disease name" />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-slate-600">symptoms</label>
          <input value={form.symptoms} onChange={onChange('symptoms')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Symptoms" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">severity</label>
          <select value={form.severity} onChange={onChange('severity')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
            <option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">diagnosed_on</label>
          <input type="date" value={form.diagnosed_on} onChange={onChange('diagnosed_on')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
        </div>
        <div className="flex flex-col gap-1 md:col-span-3">
          <label className="text-xs text-slate-600">notes</label>
          <input value={form.notes} onChange={onChange('notes')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Notes" />
        </div>
        <div className="md:col-span-3 flex gap-2">
          <button onClick={add} disabled={saving} className="px-4 py-2 rounded-full bg-[#0f172a] text-[#edfdfd] text-sm font-semibold disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </section>
  );
}