import React from "react";
import { useAuth } from "../../../context/AuthContext";
import apiConfig from "../../../config/apiConfig";
import { queueAddDeworming } from "../../../services/syncService";

export default function DewormingTab({ pet, summary, onChanged }) {
  const { token } = useAuth();
  const recent = summary?.dewormings?.recent ?? [];
  const [saving, setSaving] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [form, setForm] = React.useState({
    product_name: "", administered_on: "", due_on: "", weight_based_dose: "", notes: ""
  });
  const onChange = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));

  const add = async () => {
    if (!token || !pet?.id) return;
    setSaving(true);
    
    const dewormingData = { pet_id: pet.id, ...form };
    
    try {
      if (!navigator.onLine) {
        setSyncing(true);
        await queueAddDeworming(dewormingData);
        setForm({ product_name: "", administered_on: "", due_on: "", weight_based_dose: "", notes: "" });
        onChanged?.();
        alert('Deworming saved locally and will sync when online');
        return;
      }
      
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.care.addDeworming}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(dewormingData)
      });
      if (!res.ok) throw new Error("Failed to add deworming");
      setForm({ product_name: "", administered_on: "", due_on: "", weight_based_dose: "", notes: "" });
      onChanged?.();
    } catch (e) {
      alert(e.message || "Failed to add deworming");
    } finally {
      setSaving(false);
      setSyncing(false);
    }
  };

  return (
    <section className="p-4 bg-white/80 border border-white rounded-2xl shadow">
      <div className="text-sm font-medium mb-2">Recent deworming</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {recent.length ? recent.map(d => (
          <div key={d.id} className="p-3 bg-white border border-slate-100 rounded-xl">
            <div className="text-sm font-semibold">{d.product_name}</div>
            <div className="text-xs text-slate-600">Admin: {d.administered_on ? new Date(d.administered_on).toLocaleDateString() : "—"}</div>
            <div className="text-xs text-slate-600">Due: {d.due_on ? new Date(d.due_on).toLocaleDateString() : "—"}</div>
          </div>
        )) : (
          <div className="text-sm text-slate-500">No deworming yet.</div>
        )}
      </div>

      <div className="text-sm font-medium mb-2">Add deworming</div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-slate-600">product_name</label>
          <input value={form.product_name} onChange={onChange('product_name')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Product name" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">administered_on</label>
          <input type="date" value={form.administered_on} onChange={onChange('administered_on')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">due_on</label>
          <input type="date" value={form.due_on} onChange={onChange('due_on')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">weight_based_dose</label>
          <input value={form.weight_based_dose} onChange={onChange('weight_based_dose')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Dose (e.g. 1 tab/10kg)" />
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