import React from "react";
import { useAuth } from "../../../context/AuthContext";
import apiConfig from "../../../config/apiConfig";
import { queueUpdatePet } from "../../../services/syncService";
import { putInStore, STORES } from "../../../utils/indexedDB";

export default function BasicInfoTab({ pet, onSaved }) {
  const { token } = useAuth();
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "", species: "", breed: "", sex: "", birthdate: "", weight_kg: "", is_neutered: false, notes: ""
  });

  React.useEffect(() => {
    if (!pet) return;
    setForm({
      name: pet.name || "",
      species: pet.species || "",
      breed: pet.breed || "",
      sex: pet.sex || "",
      birthdate: pet.birthdate ? new Date(pet.birthdate).toISOString().slice(0,10) : "",
      weight_kg: pet.weight_kg ?? "",
      is_neutered: !!pet.is_neutered,
      notes: pet.notes || ""
    });
  }, [pet?.id]);

  const onChange = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = async () => {
    if (!token || !pet?.id) return;
    setSaving(true);
    
    const updatedData = {
      name: form.name,
      species: form.species,
      breed: form.breed,
      sex: form.sex,
      birthdate: form.birthdate || null,
      weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      is_neutered: !!form.is_neutered,
      notes: form.notes || null
    };
    
    try {
      // Optimistic UI update - update local cache immediately
      const optimisticPet = { ...pet, ...updatedData };
      await putInStore(STORES.PETS, optimisticPet);
      
      if (!navigator.onLine) {
        // Queue for sync when offline
        setSyncing(true);
        await queueUpdatePet(pet.id, updatedData);
        onSaved?.();
        alert('Changes saved locally and will sync when online');
        return;
      }
      
      // Online - send to server
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.pets.update(pet.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedData)
      });
      
      if (!res.ok) throw new Error("Failed to update pet");
      onSaved?.();
    } catch (e) {
      alert(e.message || "Failed to update pet");
    } finally {
      setSaving(false);
      setSyncing(false);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file || !token || !pet?.id) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.pets.uploadAvatar(pet.id)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      if (!res.ok) throw new Error("Avatar upload failed");
      onSaved?.();
    } catch (e) {
      alert(e.message || "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="p-4 bg-white/80 border border-white rounded-2xl shadow">
      <div className="mb-3">
        <div className="text-sm font-medium mb-2">Avatar</div>
        <div className="flex items-start gap-3">
          <img src={pet?.avatar_url || "/placeholder.png"} alt={pet?.name} className="w-16 h-16 rounded-xl border border-slate-200 object-cover" />
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-slate-600">avatar_url</label>
            <input type="file" accept="image/*" onChange={(e)=>uploadAvatar(e.target.files?.[0])} disabled={uploading} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-slate-600">name</label>
          <input value={form.name} onChange={onChange('name')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Name" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">species</label>
          <input value={form.species} onChange={onChange('species')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Species" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">breed</label>
          <input value={form.breed} onChange={onChange('breed')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Breed" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">sex</label>
          <select value={form.sex} onChange={onChange('sex')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80">
            <option value="">Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">birthdate</label>
          <input type="date" value={form.birthdate} onChange={onChange('birthdate')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-600">weight_kg</label>
          <input type="number" step="0.01" value={form.weight_kg} onChange={onChange('weight_kg')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Weight (kg)" />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-slate-600">is_neutered</label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_neutered} onChange={onChange('is_neutered')} />
            <span className="text-sm text-slate-700">Neutered</span>
          </label>
        </div>
        <div className="flex flex-col gap-1 md:col-span-4">
          <label className="text-xs text-slate-600">notes</label>
          <input value={form.notes} onChange={onChange('notes')} className="px-3 py-2 rounded-xl border border-slate-200 bg-white/80" placeholder="Notes" />
        </div>
        <div className="md:col-span-3 flex gap-2 items-center">
          <button 
            onClick={save} 
            disabled={saving} 
            className="px-4 py-2 rounded-full bg-[#0f172a] text-[#edfdfd] text-sm font-semibold disabled:opacity-60 flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
          >
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