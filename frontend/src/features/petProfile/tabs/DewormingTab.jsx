import React from "react";
import { useAuth } from "../../../context/AuthContext";
import apiConfig from "../../../config/apiConfig";

export default function DewormingTab({ pet, summary, onChanged }) {
  const { token } = useAuth();
  const recent = summary?.dewormings?.recent ?? [];
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    product_name: "", administered_on: "", due_on: "", weight_based_dose: "", notes: ""
  });
  const onChange = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));

  const add = async () => {
    if (!token || !pet?.id) return;
    setSaving(true);
    
    const dewormingData = { pet_id: pet.id, ...form };
    
    try {
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
          </button>
        </div>
      </div>
    </section>
  );
}