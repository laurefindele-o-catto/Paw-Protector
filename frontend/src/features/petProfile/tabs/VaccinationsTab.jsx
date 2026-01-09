import React from "react";
import { useAuth } from "../../../context/AuthContext";
import apiConfig from "../../../config/apiConfig";
import { queueAddVaccination } from "../../../services/syncService";

export default function VaccinationsTab({ pet, summary, onChanged }) {
  const { token } = useAuth();
  const recent = summary?.vaccinations?.recent ?? [];
  const [saving, setSaving] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [form, setForm] = React.useState({
    vaccine_name: "", dose_number: 1, administered_on: "", due_on: "", notes: ""
  });
  const onChange = (k) => (e) => setForm(s => ({ ...s, [k]: k === 'dose_number' ? Number(e.target.value) : e.target.value }));

  const add = async () => {
    if (!token || !pet?.id) return;
    setSaving(true);
    
    const vaccinationData = { pet_id: pet.id, ...form };
    
    try {
      if (!navigator.onLine) {
        setSyncing(true);
        await queueAddVaccination(vaccinationData);
        setForm({ vaccine_name: "", dose_number: 1, administered_on: "", due_on: "", notes: "" });
        onChanged?.();
        alert('Vaccination saved locally and will sync when online');
        return;
      }
      
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
      setSyncing(false);
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
    </section>
  );
}