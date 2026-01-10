import React from "react";
import { useAuth } from "../../../context/AuthContext";
import apiConfig from "../../../config/apiConfig";

export default function VaccinationsTab({ pet, summary, onChanged }) {
  const { token } = useAuth();
  const recent = summary?.vaccinations?.recent ?? [];
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    vaccine_name: "", dose_number: 1, administered_on: "", due_on: "", notes: ""
  });
  const onChange = (k) => (e) => setForm(s => ({ ...s, [k]: k === 'dose_number' ? Number(e.target.value) : e.target.value }));

  const add = async () => {
    if (!token || !pet?.id) return;
    setSaving(true);
    
    const vaccinationData = { pet_id: pet.id, ...form };
    
    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.care.addVaccination}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(vaccinationData)
      });
      if (!res.ok) throw new Error("Failed to add vaccination");
      setForm({ vaccine_name: "", dose_number: 1, administered_on: "", due_on: "", notes: "" });

      onChanged?.();
    } catch (e) {
      alert(e.message || "Failed to add vaccination");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="p-4 bg-white/80 border border-white rounded-2xl shadow">
      <div className="text-sm font-medium mb-2">Recent vaccinations</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {recent.length ? recent.map(v => (
          <div key={v.id} className="p-3 bg-white border border-slate-100 rounded-xl">
            <div className="text-sm font-semibold">{v.vaccine_name}</div>
            <div className="text-xs text-slate-600">Dose {v.dose_number ?? "—"}</div>
            <div className="text-xs text-slate-600">Admin: {v.administered_on ? new Date(v.administered_on).toLocaleDateString() : "—"}</div>
            <div className="text-xs text-slate-600">Due: {v.due_on ? new Date(v.due_on).toLocaleDateString() : "—"}</div>
          </div>
        )) : (
          <div className="text-sm text-slate-500">No vaccinations yet.</div>
        )}
      </div>

      <div className="text-sm font-medium mb-2">Add vaccination</div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">vaccine_name</label>
          <input value={form.vaccine_name} onChange={onChange('vaccine_name')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Vaccine name" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">dose_number</label>
          <input type="number" value={form.dose_number} onChange={onChange('dose_number')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Dose #" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">administered_on</label>
          <input type="date" value={form.administered_on} onChange={onChange('administered_on')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">due_on</label>
          <input type="date" value={form.due_on} onChange={onChange('due_on')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-slate-600">notes</label>
          <input value={form.notes} onChange={onChange('notes')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Notes" />
        </div>
        <div className="md:col-span-3 flex gap-2 items-center">
          <button onClick={add} disabled={saving} className="px-4 py-2 rounded-full bg-[#0f172a] text-[#edfdfd] text-sm font-semibold disabled:opacity-60 flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </section>
  );
}