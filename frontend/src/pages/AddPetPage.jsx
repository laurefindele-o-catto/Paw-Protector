import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiConfig from "../config/apiConfig";
import { Loader } from "../components/Loader";
import { useLoader } from "../hooks/useLoader";
import { usePet } from "../context/PetContext";
import Header from "../components/Header";

function AddPetPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("cat");
  const [subBreed, setSubBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  // Optional initial health snapshot (creates one row in pet_health_metrics)
  const [bodyTempC, setBodyTempC] = useState("");
  const [heartRateBpm, setHeartRateBpm] = useState("");
  const [respirationRateBpm, setRespirationRateBpm] = useState("");
  const [healthNote, setHealthNote] = useState("");
  const [diseases, setDiseases] = useState([
    { disease_name: "", symptoms: "", severity: "", status: "", diagnosed_on: "", notes: "" }
  ]);
  const [vaccineEntries, setVaccineEntries] = useState([
    { vaccine_name: "Rabies", administered_on: "", dose: "Standard" }
  ]);
  const [dewormEntries, setDewormEntries] = useState([
    { product_name: "Albendazole", administered_on: "", dose: "Standard" }
  ]);
  const [spayed, setSpayed] = useState(false);
  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasDisease, setHasDisease] = useState(false);
  const { selectPet, reload } = usePet();

  const catBreeds = ["Persian", "Bengal", "Siamese", "Ragdoll", "British Shorthair", "Domestic Shorthair", "Other"];
  const dogBreeds = ["Labrador Retriever", "German Shepherd", "Golden Retriever", "Beagle", "Pug", "Shih Tzu", "Other"];
  const breedOptions = species === 'dog' ? dogBreeds : catBreeds;

  const resolvedBreed = (subBreed === 'Other' ? customBreed : subBreed).trim();

  const buildNotes = () => {
    const parts = [];
    if (ageYears) parts.push(`Age (years): ${ageYears}`);
    if (notes) parts.push(`Notes: ${notes}`);
    return parts.join("\n");
  };

  const handleAddDisease = () => setDiseases([...diseases, { disease_name: "", symptoms: "", severity: "", status: "", diagnosed_on: "", notes: "" }]);
  const handleDiseaseChange = (i, field, value) => {
    const updated = [...diseases];
    updated[i] = { ...updated[i], [field]: value };
    setDiseases(updated);
  };

  const updateVaccineEntry = (idx, key, value) => {
    setVaccineEntries((prev) => prev.map((v, i) => (i === idx ? { ...v, [key]: value } : v)));
  };

  const addVaccineEntry = () => setVaccineEntries((prev) => [...prev, { vaccine_name: "Rabies", administered_on: "", dose: "Standard" }]);
  const removeVaccineEntry = (idx) => setVaccineEntries((prev) => prev.filter((_, i) => i !== idx));

  const updateDewormEntry = (idx, key, value) => {
    setDewormEntries((prev) => prev.map((d, i) => (i === idx ? { ...d, [key]: value } : d)));
  };

  const addDewormEntry = () => setDewormEntries((prev) => [...prev, { product_name: "Albendazole", administered_on: "", dose: "Standard" }]);
  const removeDewormEntry = (idx) => setDewormEntries((prev) => prev.filter((_, i) => i !== idx));

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImage(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    // ensure top of page
    try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch {}
  }, []);

  const safeParseError = async (res) => {
    try { return await res.json(); } catch { return { error: await res.text() }; }
  };

  const submitPet = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (!name.trim()) throw new Error("Pet name is required");

      const composedNotes = buildNotes();
      const weightNum = weight !== "" ? Number(weight) : null;
      const sexValue = gender ? gender.toLowerCase() : null;

      const perRes = await fetch(
        `${apiConfig.baseURL}${apiConfig.pets.create}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            breed: resolvedBreed || null,
            species,
            sex: sexValue,
            birthdate: birthdate || null,
            weight_kg: Number.isFinite(weightNum) ? weightNum : null,
            avatar_url: selectedFile ? null : "https://images.unsplash.com/photo-1592194996308-7b43878e84a6",
            is_neutered: spayed,
            notes: composedNotes || null,
          })
        }
      );
      if (!perRes.ok) {
        const err = await safeParseError(perRes);
        throw new Error(err?.error || "Failed to create pet");
      }

      const data = await perRes.json();
      let finalPet = data.pet;
      const petId = finalPet?.id;
      if (!petId) throw new Error("Pet id missing in response");

      if (selectedFile) {
        const formData = new FormData();
        formData.append("avatar", selectedFile);
        const uploadRes = await fetch(
          `${apiConfig.baseURL}${apiConfig.pets.uploadAvatar(petId)}`,
          { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData }
        );
        if (!uploadRes.ok) {
          const err = await safeParseError(uploadRes);
          throw new Error(err?.error || "Failed to upload pet image");
        }
        const upJson = await uploadRes.json();
        finalPet = upJson.pet || finalPet;
      }
      localStorage.setItem("current_pet_id", String(finalPet.id));
      localStorage.setItem("current_pet", JSON.stringify(finalPet));
      try { selectPet(finalPet.id); } catch {}
      try { await reload(); } catch {}

      // Optional initial health metric (creates a row for better first-time suggestions)
      const hasHealthSnapshot =
        (bodyTempC !== "" && !Number.isNaN(Number(bodyTempC))) ||
        (heartRateBpm !== "" && !Number.isNaN(Number(heartRateBpm))) ||
        (respirationRateBpm !== "" && !Number.isNaN(Number(respirationRateBpm))) ||
        (healthNote || "").trim().length > 0 ||
        (weightNum != null && Number.isFinite(weightNum));

      if (hasHealthSnapshot) {
        const metricRes = await fetch(`${apiConfig.baseURL}${apiConfig.pets.metrics.add(petId)}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            measured_at: null,
            weight_kg: Number.isFinite(weightNum) ? weightNum : null,
            body_temp_c: bodyTempC !== "" ? Number(bodyTempC) : null,
            heart_rate_bpm: heartRateBpm !== "" ? Number(heartRateBpm) : null,
            respiration_rate_bpm: respirationRateBpm !== "" ? Number(respirationRateBpm) : null,
            note: (healthNote || '').trim() || null,
          })
        });
        if (!metricRes.ok) {
          const err = await safeParseError(metricRes);
          throw new Error(err?.error || 'Failed to save initial health snapshot');
        }
      }

      if (hasDisease) {
        for (const disease of diseases) {
          if (!disease.disease_name?.trim()) continue;
          const res = await fetch(`${apiConfig.baseURL}${apiConfig.pets.diseases.create(petId)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(disease)
          });
          if (!res.ok) {
            const err = await safeParseError(res);
            throw new Error(err?.error || "Failed to add disease");
          }
        }
      }

      // Vaccines aligned with alerts page fields
      for (const v of vaccineEntries) {
        if (!v.vaccine_name || !v.administered_on) continue;
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.care.addVaccination}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pet_id: petId,
            vaccine_name: v.vaccine_name,
            administered_on: v.administered_on,
            dose: v.dose || null,
            notes: 'Captured at onboarding'
          })
        });
        if (!res.ok) { const err = await safeParseError(res); throw new Error(err?.error || "Failed to add vaccination"); }
      }

      // Deworming aligned with alerts page fields
      for (const d of dewormEntries) {
        if (!d.product_name || !d.administered_on) continue;
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.care.addDeworming}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            pet_id: petId,
            product_name: d.product_name,
            administered_on: d.administered_on,
            dose: d.dose || null,
            notes: 'Captured at onboarding'
          })
        });
        if (!res.ok) { const err = await safeParseError(res); throw new Error(err?.error || "Failed to add deworming treatment"); }
      }

      alert("Pet saved!");
      navigate("/pet-profile");
    } catch (err) {
      alert(err.message || "Failed to add pet");
    }
  };

  const { run: handleSubmit, loading } = useLoader(submitPet);

  return (
    <>
    <Header />
    <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden mt-28">
      {/* animated background shapes (LandingPage palette) */}
      <div className="pointer-events-none fixed -top-32 -left-16 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed top-40 -right-10 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
      <div className="pointer-events-none fixed bottom-10 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed -bottom-24 right-20 h-72 w-72 border-18 border-[#fdd142]/20 rounded-full animate-[spin_20s_linear_infinite]" />

      {/* diagonal dots accent */}
      <div className="pointer-events-none absolute -top-6 right-8 h-32 w-32 opacity-30 animate-[slideDots_10s_linear_infinite]">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0f172a]/40" />
          ))}
        </div>
      </div>
      <button
        onClick={() => navigate("/dashboard")}
        className="absolute top-6 left-6 flex items-center px-4 py-2 bg-black text-[#ffffff] rounded-lg shadow hover:bg-gray-700 transition z-20"
        aria-label="Back to dashboard"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </button>

      <div className="relative flex flex-col  mx-auto max-w-6xl px-6 py-14">
        {/* Header */}
        <div className="grid grid-cols-2 items-left justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#edfdfd] font-bold text-xs">
                PP
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Add Pet
              </h1>
            </div>
            <p className="text-slate-600 mb-10">
              Help us know your buddy better.{" "}
              <span className="underline decoration-4 decoration-[#fdd14280]">
                Fill in the details
              </span>{" "}
              and save.
            </p>
          </div>
          <div className="flex flex-col items-right md:items-end mb-0">
            <label className="w-30 h-30 flex items-center justify-center border-2 border-dashed rounded-full cursor-pointer transition bg-white/80 border-slate-300 hover:border-[#fdd142] hover:bg-white">
              {image ? (
                <img
                  src={image}
                  alt="Pet Preview"
                  className="w-30 h-30 object-cover rounded-full"
                />
              ) : (
                <span className="text-slate-500 text-sm">Upload Photo</span>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <p className="text-xs text-slate-500 mt-2">JPG/PNG up to ~5MB</p>
          </div>
        </div>

        {/* Image Upload Section */}

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-5xl mx-auto bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 md:p-10 animate-[slideup_0.6s_ease-out]"
        >
          {/* tiny floating accent inside card */}
          <div className="pointer-events-none absolute -top-4 -right-4 h-12 w-12 bg-[#fdd142] rounded-full opacity-70 animate-[float_6s_ease-in-out_infinite]" />

          {/* Basic Info Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                  placeholder="Enter Pet Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Species</label>
                <select
                  value={species}
                  onChange={e => { setSpecies(e.target.value); setSubBreed(''); setCustomBreed(''); }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                >
                  <option value="cat">Cat</option>
                  <option value="dog">Dog</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Breed (subspecies)</label>
                <select
                  value={subBreed}
                  onChange={e => setSubBreed(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                >
                  <option value="">Select</option>
                  {breedOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {(subBreed === 'Other') && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">Custom breed (optional)</label>
                <input
                  type="text"
                  value={customBreed}
                  onChange={e => setCustomBreed(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                  placeholder="Type breed name"
                />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age (years)</label>
                <input
                  type="number"
                  min="0"
                  value={ageYears}
                  onChange={e => setAgeYears(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Birthdate (optional)</label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={e => setBirthdate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male ♂</option>
                  <option value="Female">Female ♀</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={spayed}
                onChange={e => setSpayed(e.target.checked)}
                className="h-5 w-5 text-[#0f172a] focus:ring-[#fdd142] border-slate-300 rounded"
              />
              <label className="text-slate-800">Spayed / Neutered</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Extra notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                placeholder="Anything you want us to know"
                rows={3}
              />
            </div>
          </div>

          {/* Optional initial health snapshot */}
          <div className="mt-10">
            <label className="block text-sm font-medium text-slate-700 mb-2">Initial health snapshot (optional)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Body temperature (°C)</label>
                <input
                  type="number"
                  value={bodyTempC}
                  onChange={(e) => setBodyTempC(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Heart rate (bpm)</label>
                <input
                  type="number"
                  value={heartRateBpm}
                  onChange={(e) => setHeartRateBpm(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Respiration rate (bpm)</label>
                <input
                  type="number"
                  value={respirationRateBpm}
                  onChange={(e) => setRespirationRateBpm(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                  placeholder="Optional"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-600 mb-1">Note</label>
                <input
                  type="text"
                  value={healthNote}
                  onChange={(e) => setHealthNote(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                  placeholder="e.g., energetic, mild cough"
                />
              </div>
            </div>
          </div>

          {/* Known Diseases (optional) */}
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <input
                id="hasDisease"
                type="checkbox"
                checked={hasDisease}
                onChange={e => setHasDisease(e.target.checked)}
                className="h-5 w-5 text-[#0f172a] focus:ring-[#fdd142] border-slate-300 rounded"
              />
              <label htmlFor="hasDisease" className="text-slate-800">
                Has previous illness?
              </label>
            </div>

            {hasDisease && (
              <>
                <label className="block text-sm font-medium text-slate-700 mb-4">Known Diseases</label>
                {diseases.map((disease, i) => (
                  <div key={i} className="space-y-3 mb-4 p-4 bg-slate-50 rounded-xl">
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={disease.disease_name}
                        onChange={e => handleDiseaseChange(i, "disease_name", e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                        placeholder="Disease Name"
                      />
                      <input
                        type="text"
                        value={disease.symptoms}
                        onChange={e => handleDiseaseChange(i, "symptoms", e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                        placeholder="Illness / Symptoms"
                      />
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-2 gap-3">
                      <select
                        value={disease.severity}
                        onChange={e => handleDiseaseChange(i, "severity", e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                      >
                        <option value="">Select Severity</option>
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                      <select
                        value={disease.status}
                        onChange={e => handleDiseaseChange(i, "status", e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                      >
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <input
                        type="date"
                        value={disease.diagnosed_on}
                        onChange={e => handleDiseaseChange(i, "diagnosed_on", e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                      />
                    </div>
                    <input
                      type="text"
                      value={disease.notes}
                      onChange={e => handleDiseaseChange(i, "notes", e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                      placeholder="Notes"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddDisease}
                  className="text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-full px-4 py-2 hover:shadow-sm hover:-translate-y-px transition"
                >
                  + Add another disease
                </button>
              </>
            )}
          </div>

          {/* Vaccines */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-slate-700">Vaccinations</label>
              <button type="button" onClick={addVaccineEntry} className="text-xs font-semibold text-[#0f172a]">+ Add dose</button>
            </div>
            <div className="space-y-3">
              {vaccineEntries.map((v, idx) => (
                <div key={idx} className="grid grid-cols-3 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600">Vaccine</label>
                    <select
                      value={v.vaccine_name}
                      onChange={e => updateVaccineEntry(idx, 'vaccine_name', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-sm"
                    >
                      <option>Rabies</option>
                      <option>Flu</option>
                      <option>FVRCP</option>
                      <option>FeLV</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600">Administered on</label>
                    <input
                      type="date"
                      value={v.administered_on}
                      onChange={e => updateVaccineEntry(idx, 'administered_on', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600">Dose</label>
                    <select
                      value={v.dose}
                      onChange={e => updateVaccineEntry(idx, 'dose', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-sm"
                    >
                      <option>Standard</option>
                      <option>Booster</option>
                      <option>Half</option>
                    </select>
                  </div>
                  {vaccineEntries.length > 1 && (
                    <div className="md:col-span-3 text-right">
                      <button type="button" onClick={() => removeVaccineEntry(idx)} className="text-xs text-red-600">Remove</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Deworming */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-slate-700">Deworming</label>
              <button type="button" onClick={addDewormEntry} className="text-xs font-semibold text-[#0f172a]">+ Add dose</button>
            </div>
            <div className="space-y-3">
              {dewormEntries.map((d, idx) => (
                <div key={idx} className="grid grid-cols-3 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600">Product</label>
                    <select
                      value={d.product_name}
                      onChange={e => updateDewormEntry(idx, 'product_name', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-sm"
                    >
                      <option>Albendazole</option>
                      <option>Fenbendazole</option>
                      <option>Helminticide-L</option>
                      <option>Drontal</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600">Administered on</label>
                    <input
                      type="date"
                      value={d.administered_on}
                      onChange={e => updateDewormEntry(idx, 'administered_on', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-600">Dose</label>
                    <select
                      value={d.dose}
                      onChange={e => updateDewormEntry(idx, 'dose', e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-sm"
                    >
                      <option>Standard</option>
                      <option>Half</option>
                      <option>Weight-adjusted</option>
                    </select>
                  </div>
                  {dewormEntries.length > 1 && (
                    <div className="md:col-span-3 text-right">
                      <button type="button" onClick={() => removeDewormEntry(idx)} className="text-xs text-red-600">Remove</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="mt-10 w-full px-6 py-3 rounded-full text-white font-semibold transition transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
            style={{
              backgroundColor: loading ? "#9DB89B" : (isHovered ? "#9DB89B" : "#B6CEB4"),
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <Loader />
                <span>Processing...</span>
              </>
            ) : (
              "Save Pet"
            )}
          </button>
        </form>
      </div>

      {/* keyframes (mirrors LandingPage) */}
      <style>{`
        @keyframes slideup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bouncey {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideDots {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-30px) translateX(30px); }
        }
      `}</style>
    </div>
    </>
  );
}

export default AddPetPage;
