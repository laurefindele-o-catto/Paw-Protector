// vaccineAlert.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const VaccineAlert = ({ userId }) => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [dewormings, setDewormings] = useState([]);
  const [dewormProduct, setDewormProduct] = useState("");

  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const res = await axios.get(`/api/pets/owner/${userId}`);
        setPets(res.data.pets || []);
        if (res.data.pets && res.data.pets.length > 0) {
          setSelectedPet(res.data.pets[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch pets", err);
        setPets([]);
      }
    };
    fetchPets();
  }, [userId]);

  // Fetch vaccinations + dewormings for selected pet
  useEffect(() => {
    if (!selectedPet) return;
    const fetchData = async () => {
      try {
        const vacRes = await axios.get(`/api/care/vaccinations/${selectedPet}`);
        setVaccinations(vacRes.data);

        const dewRes = await axios.get(`/api/care/dewormings/${selectedPet}`);
        setDewormings(dewRes.data);
      } catch (err) {
        console.error("Failed to fetch care data", err);
      }
    };
    fetchData();
  }, [selectedPet]);

  // Update last dosage
  const handleUpdateDose = async (type, name) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      if (type === "vaccination") {
        await axios.post("/api/care/vaccination", {
          pet_id: selectedPet,
          vaccine_name: name,
          administered_on: today,
          notes: "Updated via app",
        });
      } else if (type === "deworming") {
        await axios.post("/api/care/deworming", {
          pet_id: selectedPet,
          product_name: name,
          administered_on: today,
          weight_based_dose: null,
          notes: "Updated via app",
        });
      }

      // refresh data
      if (type === "vaccination") {
        const vacRes = await axios.get(`/api/care/vaccinations/${selectedPet}`);
        setVaccinations(vacRes.data);
      } else {
        const dewRes = await axios.get(`/api/care/dewormings/${selectedPet}`);
        setDewormings(dewRes.data);
      }
    } catch (err) {
      console.error("Failed to update dose", err);
    }
  };

  // Helpers
  const getVaccineInfo = (name) => {
    const record = vaccinations
      .filter((v) => v.vaccine_name.toLowerCase() === name.toLowerCase())
      .sort((a, b) => new Date(b.administered_on) - new Date(a.administered_on))[0];
    return record || null;
  };

  const getDewormingInfo = () => {
    if (!dewormings.length) return null;
    return dewormings.sort(
      (a, b) => new Date(b.administered_on) - new Date(a.administered_on)
    )[0];
  };

  return (
    <section className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden px-6 py-10">
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

      {/* header */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#edfdfd] font-bold text-xs">
            PP
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Vaccine & Deworming Alerts
          </h1>
        </div>
        <p className="text-slate-600">
          Keep your pet’s health on track.{" "}
          <span className="underline decoration-4 decoration-[#fdd14280]">
            Select a pet
          </span>{" "}
          to see due dates and update doses.
        </p>
      </div>

      {/* Pet Selector */}
      <div className="mb-8 max-w-5xl mx-auto bg-white/85 backdrop-blur border border-white rounded-3xl shadow p-6 animate-[slideup_0.6s_ease-out]">
        <label className="block text-sm font-medium text-slate-800 mb-2">
          Select Your Pet
        </label>
        <select
          value={selectedPet || ""}
          onChange={(e) => setSelectedPet(Number(e.target.value))}
          className="w-full md:w-1/3 px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
        >
          {Array.isArray(pets) &&
            pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} ({pet.species})
              </option>
            ))}
        </select>
      </div>

      {/* Vaccine Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Rabies */}
        <div className="relative bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 flex flex-col h-fit animate-[slideup_0.6s_ease-out]">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Rabies
          </h2>
          <div className="flex-1 text-sm text-slate-700 space-y-1">
            {getVaccineInfo("Rabies") ? (
              <>
                <p>● Last dose on {getVaccineInfo("Rabies").administered_on}</p>
                <p>● Upcoming dose - {getVaccineInfo("Rabies").due_on || "Not set"}</p>
              </>
            ) : (
              <p>
                No vaccination record found. Rabies vaccine must be administered at
                3 months of age and reboosted yearly.
              </p>
            )}
          </div>
          <button
            onClick={() => handleUpdateDose("vaccination", "Rabies")}
            className="mt-4 px-5 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px]"
          >
            Update Last Dose
          </button>

          {/* tiny floating accent */}
          <div className="pointer-events-none absolute -top-3 -right-3 h-8 w-8 bg-[#fdd142] rounded-full opacity-80 animate-[float_6s_ease-in-out_infinite]" />
        </div>

        {/* Flu */}
        <div className="relative bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 flex flex-col h-fit animate-[slideup_0.6s_ease-out]">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Flu
          </h2>
          <div className="flex-1 text-sm text-slate-700 space-y-1">
            {getVaccineInfo("Flu") ? (
              <>
                <p>● Last dose on {getVaccineInfo("Flu").administered_on}</p>
                <p>● Upcoming dose - {getVaccineInfo("Flu").due_on || "Not set"}</p>
              </>
            ) : (
              <p>
                No vaccination record found. Flu vaccine should be given at 2 months
                of age and reboosted yearly.
              </p>
            )}
          </div>
          <button
            onClick={() => handleUpdateDose("vaccination", "Flu")}
            className="mt-4 px-5 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px]"
          >
            Update Last Dose
          </button>

          {/* tiny floating accent */}
          <div className="pointer-events-none absolute -top-3 -right-3 h-8 w-8 bg-[#fdd142] rounded-full opacity-80 animate-[float_6s_ease-in-out_infinite]" />
        </div>

        {/* Deworming */}
        <div className="relative bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 flex flex-col sm:col-span-2 h-fit animate-[slideup_0.6s_ease-out]">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Deworming
          </h2>
          <div className="flex-1 text-sm text-slate-700 space-y-1">
            {getDewormingInfo() ? (
              <>
                <p>● Last dose on {getDewormingInfo().administered_on}</p>
                <p>● Upcoming dose - {getDewormingInfo().due_on || "Not set"}</p>
              </>
            ) : (
              <p>No deworming record found. Please provide details.</p>
            )}
          </div>

          {/* Product selector */}
          <label className="mt-4 text-sm text-slate-700">Select Product</label>
          <select
            value={dewormProduct}
            onChange={(e) => setDewormProduct(e.target.value)}
            className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition mt-1"
          >
            <option value="">-- Choose a product --</option>
            <option value="Albendazole">Albendazole</option>
            <option value="Fenbendazole">Fenbendazole</option>
            <option value="Helminticide-L">Helminticide-L</option>
            <option value="Drontal">Drontal</option>
            <option value="Other">Other</option>
          </select>

          <button
            onClick={() => handleUpdateDose("deworming", dewormProduct)}
            disabled={!dewormProduct}
            className="mt-4 px-5 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px] disabled:opacity-50"
          >
            Update Last Dose
          </button>

          {/* tiny floating accent */}
          <div className="pointer-events-none absolute -top-3 -right-3 h-8 w-8 bg-[#fdd142] rounded-full opacity-80 animate-[float_6s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 bg-white/85 backdrop-blur border border-white rounded-3xl shadow p-6 max-w-3xl mx-auto">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          Other Recommended Vaccines
        </h3>
        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
          <li>Feline Panleukopenia (Distemper) – yearly booster</li>
          <li>Feline Calicivirus – yearly booster</li>
          <li>Feline Herpesvirus – yearly booster</li>
          <li>Optional: Feline Leukemia (FeLV) – for outdoor cats</li>
        </ul>
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
    </section>
  );
};

export default VaccineAlert;
