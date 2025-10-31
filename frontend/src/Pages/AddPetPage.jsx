import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiConfig from "../config/apiConfig";
import { Loader } from "../Components/Loader";
import { useLoader } from "../hooks/useLoader";

function AddPetPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [diseases, setDiseases] = useState([
    { disease_name: "", symptoms: "", severity: "", status: "", diagnosed_on: "", notes: "" }
  ]);
  const [vaccines, setVaccines] = useState({
    rabies: { checked: false, date: "" },
    flu: { checked: false, date: "" },
    deworming: { checked: false, date: "" },
  });
  const [spayed, setSpayed] = useState(false);
  const [image, setImage] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const catUrl = "https://images.unsplash.com/photo-1592194996308-7b43878e84a6";

  const handleAddDisease = () => setDiseases([...diseases, { disease_name: "", symptoms: "", severity: "", status: "", diagnosed_on: "", notes: "" }]);
  const handleDiseaseChange = (i, field, value) => {
    const updated = [...diseases];
    updated[i] = { ...updated[i], [field]: value };
    setDiseases(updated);
  };

  const handleVaccineCheck = (vaccine) => {
    setVaccines((prev) => ({
      ...prev,
      [vaccine]: { ...prev[vaccine], checked: !prev[vaccine].checked },
    }));
  };

  const handleVaccineDate = (vaccine, date) => {
    setVaccines((prev) => ({
      ...prev,
      [vaccine]: { ...prev[vaccine], date },
    }));
  };

  const handleImageUpload = (e) => {
    if (e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      setUser(u);
    }
    catch { }
  }, []);

  const submitPet = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const perRes = await fetch(
        `${apiConfig.baseURL}${apiConfig.pets.create}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name,
            breed: breed,
            species: "cat",
            sex: gender,
            weight_kg: weight,
            avatar_url: catUrl,
            is_neutered: spayed,
          })
        }
      );
      if (!perRes.ok) {
        const err = await perRes.json();
        throw new Error(err?.error || "Profile update failed");
      }
      
      const data = await perRes.json();
      console.log(data.pet);
      const petId = data.pet.id;
      
      for (const disease of diseases) {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.pets.diseases.create(petId)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(disease)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.error || "Failed to add disease");
        }
      }

      if (vaccines.rabies.checked && vaccines.rabies.date) {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.care.addVaccination}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pet_id: petId,
            vaccine_name: "rabies",
            administered_on: vaccines.rabies.date
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.error || "Failed to add rabies vaccination");
        }
      }
      if (vaccines.flu.checked && vaccines.flu.date) {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.care.addVaccination}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pet_id: petId,
            vaccine_name: "flu",
            administered_on: vaccines.flu.date
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.error || "Failed to add flu vaccination");
        }
      }
      if (vaccines.deworming.checked && vaccines.deworming.date) {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.care.addDeworming}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            pet_id: petId,
            product_name: 'Deworming',
            administered_on: vaccines.deworming.date
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.error || "Failed to add deworming treatment");
        }
      }
      alert("Pet, diseases, and care info saved!");
      navigate("/profile")
    } catch (err) {
      alert(err.message || "Failed to add pet")
    }
  };

  const { run: handleSubmit, loading } = useLoader(submitPet);

  return (
    <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden">
      {/* animated background shapes (LandingPage palette) */}
      <div className="pointer-events-none fixed -top-32 -left-16 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed top-40 -right-10 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
      <div className="pointer-events-none fixed bottom-10 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed -bottom-24 right-20 h-72 w-72 border-[18px] border-[#fdd142]/20 rounded-full animate-[spin_20s_linear_infinite]" />

      {/* diagonal dots accent */}
      <div className="pointer-events-none absolute -top-6 right-8 h-32 w-32 opacity-30 animate-[slideDots_10s_linear_infinite]">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0f172a]/40" />
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-14">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
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

        {/* Image Upload Section */}
        <div className="flex flex-col items-center mb-10">
          <label className="w-40 h-40 flex items-center justify-center border-2 border-dashed rounded-full cursor-pointer transition bg-white/80 border-slate-300 hover:border-[#fdd142] hover:bg-white">
            {image ? (
              <img
                src={image}
                alt="Pet Preview"
                className="w-40 h-40 object-cover rounded-full"
              />
            ) : (
              <span className="text-slate-500 text-sm">Upload Photo</span>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
          <p className="text-xs text-slate-500 mt-2">JPG/PNG up to ~5MB</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-[900px] mx-auto bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 md:p-10 animate-[slideup_0.6s_ease-out]"
        >
          {/* tiny floating accent inside card */}
          <div className="pointer-events-none absolute -top-4 -right-4 h-12 w-12 bg-[#fdd142] rounded-full opacity-70 animate-[float_6s_ease-in-out_infinite]" />

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                placeholder="Enter Pet Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Breed</label>
              <input
                type="text"
                value={breed}
                onChange={e => setBreed(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                placeholder="Enter Breed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                placeholder="Enter Age"
              />
            </div>

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
                placeholder="Enter Weight"
              />
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
          </div>

          {/* Known Diseases */}
          <div className="mt-10">
            <label className="block text-sm font-medium text-slate-700 mb-4">Known Diseases</label>
            {diseases.map((disease, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-4 bg-slate-50 rounded-xl">
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
                  placeholder="Symptoms"
                />
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
                  <option value="chronic">Chronic</option>
                </select>
                <input
                  type="date"
                  value={disease.diagnosed_on}
                  onChange={e => handleDiseaseChange(i, "diagnosed_on", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                />
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
              className="text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-full px-4 py-2 hover:shadow-sm hover:-translate-y-[1px] transition"
            >
              + Add another disease
            </button>
          </div>

          {/* Vaccines */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-slate-700 mb-4">Vaccines Given</label>
            <div className="space-y-3">
              {["rabies", "flu", "deworming"].map((vaccine) => (
                <div key={vaccine} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <input
                    type="checkbox"
                    checked={vaccines[vaccine].checked}
                    onChange={() => handleVaccineCheck(vaccine)}
                    id={vaccine}
                    className="h-5 w-5 text-[#0f172a] focus:ring-[#fdd142] border-slate-300 rounded"
                  />
                  <label htmlFor={vaccine} className="capitalize text-slate-700 font-medium flex-1">
                    {vaccine === "rabies" ? "Rabies" : vaccine === "flu" ? "Flu" : "Deworming"}
                  </label>
                  {vaccines[vaccine].checked && (
                    <input
                      type="date"
                      value={vaccines[vaccine].date}
                      onChange={e => handleVaccineDate(vaccine, e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                    />
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
            className="mt-10 w-full px-6 py-3 rounded-full text-white font-semibold transition transform hover:-translate-y-[2px] shadow-md flex items-center justify-center gap-2"
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
  );
}

export default AddPetPage;
