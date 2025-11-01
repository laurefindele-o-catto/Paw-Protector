import React, { useEffect, useState } from "react";
import { useAutoTranslate } from "react-autolocalise";
import apiConfig from "../config/apiConfig";
import { Loader } from "../Components/Loader";
import { useLoader } from "../hooks/useLoader";


const VaccineAlert = ({ userId }) => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [dewormings, setDewormings] = useState([]);
  const [dewormProduct, setDewormProduct] = useState("");
  const { t } = useAutoTranslate();
  const [rabiesDate, setRabiesDate] = useState("");
  const [fluDate, setFluDate] = useState("");
  const [dewormingDate, setDewormingDate] = useState("");

  // Fetch user's pets when userId changes
  useEffect(() => {
    const fetchPets = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${apiConfig.baseURL}/api/pets`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        console.log("Pets response:", data);
        setPets(data.pets || []);
        if (data.pets?.length > 0) {
          setSelectedPet(data.pets[0].id);
        } else {
          setSelectedPet(null);
        }
      } catch (err) {
        console.error("Failed to fetch pets", err);
        setPets([]);
        setSelectedPet(null);
      }
    };
    fetchPets();
  }, []);


  // Fetch vaccinations + dewormings for selected pet
  useEffect(() => {
    const fetchCareForPet = async () => {
      if (!selectedPet) {
        setVaccinations([]);
        setDewormings([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");

        const vacRes = await fetch(
          `${apiConfig.baseURL}/api/care/vaccinations/${selectedPet}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const vacData = await vacRes.json();
        setVaccinations(vacData.vaccinations || vacData || []);

        const dewRes = await fetch(
          `${apiConfig.baseURL}/api/care/dewormings/${selectedPet}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const dewData = await dewRes.json();
        setDewormings(dewData.dewormings || dewData || []);
      } catch (err) {
        console.error("Failed to fetch care data", err);
        setVaccinations([]);
        setDewormings([]);
      }
    };

    fetchCareForPet();
  }, [selectedPet]);

  // Update last dosage
  const handleUpdateDose = async (type, name, date) => {
    if (!selectedPet) {
      alert(t("Please select a pet first."));
      return;
    }
    if (!name) {
      alert(t("Please choose a product/name before updating."));
      return;
    }
    if (!date) {
      alert(t("Please select a date."));
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (type === "vaccination") {
        await fetch(`${apiConfig.baseURL}/api/care/vaccinations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pet_id: selectedPet,
            vaccine_name: name,
            administered_on: date,
            notes: "Updated via app",
          }),
        });

        // refresh
        const vacRes = await fetch(
          `${apiConfig.baseURL}/api/care/vaccinations/${selectedPet}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const vacData = await vacRes.json();
        setVaccinations(vacData.vaccinations || vacData || []);
      } else if (type === "deworming") {
        await fetch(`${apiConfig.baseURL}/api/care/dewormings`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pet_id: selectedPet,
            product_name: name,
            administered_on: date,
            weight_based_dose: null,
            notes: "Updated via app",
          }),
        });

        // refresh
        const dewRes = await fetch(
          `${apiConfig.baseURL}/api/care/dewormings/${selectedPet}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const dewData = await dewRes.json();
        setDewormings(dewData.dewormings || dewData || []);
      }
    } catch (err) {
      console.error("Failed to update dose", err);
      alert(t("Failed to update. Please try again."));
    }
  };

  // Helpers
  const getVaccineInfo = (name) => {
    if (!Array.isArray(vaccinations)) return null;
    const record = vaccinations
      .filter(
        (v) =>
          (v?.vaccine_name || "").toLowerCase() === (name || "").toLowerCase()
      )
      .sort(
        (a, b) =>
          new Date(b?.administered_on || 0) - new Date(a?.administered_on || 0)
      )[0];
    return record || null;
  };

  const getDewormingInfo = () => {
    if (!Array.isArray(dewormings) || dewormings.length === 0) return null;
    return dewormings
      .slice()
      .sort(
        (a, b) =>
          new Date(b?.administered_on || 0) - new Date(a?.administered_on || 0)
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
            {t("Vaccine & Deworming Alerts")}
          </h1>
        </div>
        <p className="text-slate-600">
          {t("Keep your pet’s health on track.")}{" "}
          <span className="underline decoration-4 decoration-[#fdd14280]">
            {t("Select a pet")}
          </span>{" "}
          {t("to see due dates and update doses.")}
        </p>
      </div>

      {/* Pet Selector */}
      <div className="mb-8 max-w-5xl mx-auto bg-white/85 backdrop-blur border border-white rounded-3xl shadow p-6 animate-[slideup_0.6s_ease-out]">
        <label className="block text-sm font-medium text-slate-800 mb-2">
          {t("Select Your Pet")}
        </label>
        <select
          aria-label={t("Select Your Pet")}
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
            {t("Rabies")}
          </h2>
          <div className="flex-1 text-sm text-slate-700 space-y-2">
            {vaccinations.filter(v => v.vaccine_name.toLowerCase() === "rabies").length > 0 ? (
              <>
                {/* Highlight latest */}
                {(() => {
                  const rabiesSorted = vaccinations
                    .filter(v => v.vaccine_name.toLowerCase() === "rabies")
                    .sort((a, b) => new Date(b.administered_on) - new Date(a.administered_on));
                  const latest = rabiesSorted[0];
                  return (
                    <div className="mb-2">
                      <p>● {t("Last dose on")} {latest.administered_on}</p>
                      <p>● {t("Upcoming dose")} - {latest.due_on || t("Not set")}</p>
                    </div>
                  );
                })()}
                {/* Full history */}
                <ul className="list-disc list-inside space-y-1">
                  {vaccinations
                    .filter(v => v.vaccine_name.toLowerCase() === "rabies")
                    .sort((a, b) => new Date(b.administered_on) - new Date(a.administered_on))
                    .map(v => (
                      <li key={v.dose_number}>
                        {t("Dose")} {v.dose_number}: {v.administered_on} → {t("due")} {v.due_on || t("Not set")} ({v.notes || t("No notes")})
                      </li>
                    ))}
                </ul>
              </>
            ) : (
              <p>
                {t("No vaccination record found. Rabies vaccine must be administered at 3 months of age and reboosted yearly.")}
              </p>
            )}
          </div>

          <input
            type="date"
            value={rabiesDate}
            onChange={(e) => setRabiesDate(e.target.value)}
            className="mt-2 border rounded-md p-2"
          />
          <button
            onClick={() => handleUpdateDose("vaccination", "Rabies", rabiesDate)}
            aria-label={t("Update Last Dose for Rabies")}
            className="mt-4 px-5 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px]"
          >
            {t("Update Last Dose")}
          </button>

          {/* tiny floating accent */}
          <div className="pointer-events-none absolute -top-3 -right-3 h-8 w-8 bg-[#fdd142] rounded-full opacity-80 animate-[float_6s_ease-in-out_infinite]" />
        </div>

        {/* Flu */}
        <div className="relative bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 flex flex-col h-fit animate-[slideup_0.6s_ease-out]">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            {t("Flu")}
          </h2>
          <div className="flex-1 text-sm text-slate-700 space-y-2">
            {vaccinations.filter(v => v.vaccine_name.toLowerCase() === "flu").length > 0 ? (
              <>
                {(() => {
                  const fluSorted = vaccinations
                    .filter(v => v.vaccine_name.toLowerCase() === "flu")
                    .sort((a, b) => new Date(b.administered_on) - new Date(a.administered_on));
                  const latest = fluSorted[0];
                  return (
                    <div className="mb-2">
                      <p>● {t("Last dose on")} {latest.administered_on}</p>
                      <p>● {t("Upcoming dose")} - {latest.due_on || t("Not set")}</p>
                    </div>
                  );
                })()}
                <ul className="list-disc list-inside space-y-1">
                  {vaccinations
                    .filter(v => v.vaccine_name.toLowerCase() === "flu")
                    .sort((a, b) => new Date(b.administered_on) - new Date(a.administered_on))
                    .map(v => (
                      <li key={v.dose_number}>
                        {t("Dose")} {v.dose_number}: {v.administered_on} → {t("due")} {v.due_on || t("Not set")} ({v.notes || t("No notes")})
                      </li>
                    ))}
                </ul>
              </>
            ) : (
              <p>
                {t("No vaccination record found. Flu vaccine should be given at 2 months of age and reboosted yearly.")}
              </p>
            )}
          </div>

          <input
            type="date"
            value={fluDate}
            onChange={(e) => setFluDate(e.target.value)}
            className="mt-2 border rounded-md p-2"
          />

          <button
            onClick={() => handleUpdateDose("vaccination", "Flu", fluDate)}
            aria-label={t("Update Last Dose for Flu")}
            className="mt-4 px-5 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px]"
          >
            {t("Update Last Dose")}
          </button>

          {/* tiny floating accent */}
          <div className="pointer-events-none absolute -top-3 -right-3 h-8 w-8 bg-[#fdd142] rounded-full opacity-80 animate-[float_6s_ease-in-out_infinite]" />
        </div>

        {/* Deworming */}
        <div className="relative bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 flex flex-col sm:col-span-2 h-fit animate-[slideup_0.6s_ease-out]">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            {t("Deworming")}
          </h2>
          <div className="flex-1 text-sm text-slate-700 space-y-2">
            {Array.isArray(dewormings) && dewormings.length > 0 ? (
              <>
                {/* Highlight latest */}
                {(() => {
                  const sorted = [...dewormings].sort(
                    (a, b) => new Date(b.administered_on) - new Date(a.administered_on)
                  );
                  const latest = sorted[0];
                  return (
                    <div className="mb-2">
                      <p>● {t("Last dose on")} {latest.administered_on}</p>
                      <p>● {t("Upcoming dose")} - {latest.due_on || t("Not set")}</p>
                    </div>
                  );
                })()}

                {/* Full history */}
                <ul className="list-disc list-inside space-y-1">
                  {[...dewormings]
                    .sort((a, b) => new Date(b.administered_on) - new Date(a.administered_on))
                    .map((d, idx) => (
                      <li key={idx}>
                        {d.product_name} — {d.administered_on} → {t("due")} {d.due_on || t("Not set")} ({d.notes || t("No notes")})
                      </li>
                    ))}
                </ul>
              </>
            ) : (
              <p>{t("No deworming record found. Please provide details.")}</p>
            )}
          </div>

          {/* Product selector */}
          <label className="mt-4 text-sm text-slate-700">{t("Select Product")}</label>
          <select
            aria-label={t("Select Deworming Product")}
            value={dewormProduct}
            onChange={(e) => setDewormProduct(e.target.value)}
            className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition mt-1"
          >
            <option value="">{t("-- Choose a product --")}</option>
            <option value="Albendazole">{t("Albendazole")}</option>
            <option value="Fenbendazole">{t("Fenbendazole")}</option>
            <option value="Helminticide-L">{t("Helminticide-L")}</option>
            <option value="Drontal">{t("Drontal")}</option>
            <option value="Other">{t("Other")}</option>
          </select>

          <input
            type="date"
            value={dewormingDate}
            onChange={(e) => setDewormingDate(e.target.value)}
            className="mt-2 border rounded-md p-2"
          />

          <button
            onClick={() => handleUpdateDose("deworming", dewormProduct, dewormingDate)}
            disabled={!dewormProduct}
            aria-label={t("Update Last Deworming Dose")}
            className="mt-4 px-5 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px] disabled:opacity-50"
          >
            {t("Update Last Dose")}
          </button>

          {/* tiny floating accent */}
          <div className="pointer-events-none absolute -top-3 -right-3 h-8 w-8 bg-[#fdd142] rounded-full opacity-80 animate-[float_6s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 bg-white/85 backdrop-blur border border-white rounded-3xl shadow p-6 max-w-3xl mx-auto">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          {t("Other Recommended Vaccines")}
        </h3>
        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
          <li>{t("Feline Panleukopenia (Distemper) – yearly booster")}</li>
          <li>{t("Feline Calicivirus – yearly booster")}</li>
          <li>{t("Feline Herpesvirus – yearly booster")}</li>
          <li>{t("Optional: Feline Leukemia (FeLV) – for outdoor cats")}</li>
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
// // ...existing code...
// ```// filepath: c:\Users\jahan\Downloads\Paw-Protector\frontend\src\Pages\vaccineAlert.jsx
// // ...existing code...
// import React, { useEffect, useState } from "react";
// import { useAutoTranslate } from "react-autolocalise";
// import apiConfig from "../config/apiConfig";
// import { Loader } from "../Components/Loader";
// import { useLoader } from "../hooks/useLoader";
// // ...existing code...

// const VaccineAlert = ({ userId }) => {
//   const [pets, setPets] = useState([]);
//   const [selectedPet, setSelectedPet] = useState(null);
//   const [vaccinations, setVaccinations] = useState([]);
//   const [dewormings, setDewormings] = useState([]);
//   const [dewormProduct, setDewormProduct] = useState("");
//   const { t } = useAutoTranslate();
//   const { loading, startLoading, stopLoading } = useLoader();

//   // Fetch user's pets when userId changes
//   useEffect(() => {
//     const fetchPets = async () => {
//       if (!userId) return;
//       startLoading();
//       try {
//         console.log("fetchPets triggered with userId:", userId);
//         const token = localStorage.getItem("token");
//         const res = await fetch(
//           `${apiConfig.baseURL}${apiConfig.pets.owner(userId)}`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//         const data = await res.json();
//         setPets(data.pets || []);
//         if (data.pets && data.pets.length > 0) {
//           setSelectedPet(data.pets[0].id);
//         } else {
//           setSelectedPet(null);
//         }
//       } catch (err) {
//         console.error("Failed to fetch pets", err);
//         setPets([]);
//         setSelectedPet(null);
//       } finally {
//         stopLoading();
//       }
//     };

//     fetchPets();
//   }, [userId, startLoading, stopLoading]);

//   // Fetch vaccinations + dewormings for selected pet
//   useEffect(() => {
//     const fetchCareForPet = async () => {
//       if (!selectedPet) {
//         setVaccinations([]);
//         setDewormings([]);
//         return;
//       }
//       startLoading();
//       try {
//         const token = localStorage.getItem("token");

//         const vacRes = await fetch(
//           `${apiConfig.baseURL}${apiConfig.care.getVaccinations(selectedPet)}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const vacData = await vacRes.json();
//         // API shape may differ; assume array or object. Normalize to array if wrapped.
//         setVaccinations(Array.isArray(vacData) ? vacData : vacData.vaccinations || []);

//         const dewRes = await fetch(
//           `${apiConfig.baseURL}${apiConfig.care.getDewormings(selectedPet)}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const dewData = await dewRes.json();
//         setDewormings(Array.isArray(dewData) ? dewData : dewData.dewormings || []);
//       } catch (err) {
//         console.error("Failed to fetch care data", err);
//         setVaccinations([]);
//         setDewormings([]);
//       } finally {
//         stopLoading();
//       }
//     };

//     fetchCareForPet();
//   }, [selectedPet, startLoading, stopLoading]);

//   // Update last dosage
//   const handleUpdateDose = async (type, name) => {
//     if (!selectedPet) {
//       alert(t("Please select a pet first."));
//       return;
//     }
//     if (!name) {
//       alert(t("Please choose a product/name before updating."));
//       return;
//     }

//     startLoading();
//     try {
//       const today = new Date().toISOString().split("T")[0];
//       const token = localStorage.getItem("token");

//       if (type === "vaccination") {
//         await fetch(`${apiConfig.baseURL}${apiConfig.care.addVaccination}`, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             pet_id: selectedPet,
//             vaccine_name: name,
//             administered_on: today,
//             notes: "Updated via app",
//           }),
//         });

//         // refresh vaccinations
//         const vacRes = await fetch(
//           `${apiConfig.baseURL}${apiConfig.care.getVaccinations(selectedPet)}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const vacData = await vacRes.json();
//         setVaccinations(Array.isArray(vacData) ? vacData : vacData.vaccinations || []);
//       } else if (type === "deworming") {
//         await fetch(`${apiConfig.baseURL}${apiConfig.care.addDeworming}`, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             pet_id: selectedPet,
//             product_name: name,
//             administered_on: today,
//             weight_based_dose: null,
//             notes: "Updated via app",
//           }),
//         });

//         // refresh dewormings
//         const dewRes = await fetch(
//           `${apiConfig.baseURL}${apiConfig.care.getDewormings(selectedPet)}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const dewData = await dewRes.json();
//         setDewormings(Array.isArray(dewData) ? dewData : dewData.dewormings || []);
//       }
//     } catch (err) {
//       console.error("Failed to update dose", err);
//       alert(t("Failed to update. Please try again."));
//     } finally {
//       stopLoading();
//     }
//   };

//   // Helpers
//   const getVaccineInfo = (name) => {
//     if (!Array.isArray(vaccinations)) return null;
//     const record = vaccinations
//       .filter((v) => (v?.vaccine_name || "").toLowerCase() === (name || "").toLowerCase())
//       .sort((a, b) => new Date(b?.administered_on || 0) - new Date(a?.administered_on || 0))[0];
//     return record || null;
//   };

//   const getDewormingInfo = () => {
//     if (!Array.isArray(dewormings) || dewormings.length === 0) return null;
//     return dewormings
//       .slice()
//       .sort((a, b) => new Date(b?.administered_on || 0) - new Date(a?.administered_on || 0))[0];
//   };

//   // Render
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <Loader />
//       </div>
//     );
//   }

//   return (
//     <section className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden px-6 py-10">
//       {/* animated background shapes (LandingPage palette) */}
//       <div className="pointer-events-none fixed -top-32 -left-16 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
//       <div className="pointer-events-none fixed top-40 -right-10 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
//       <div className="pointer-events-none fixed bottom-10 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />
//       <div className="pointer-events-none fixed -bottom-24 right-20 h-72 w-72 border-[18px] border-[#fdd142]/20 rounded-full animate-[spin_20s_linear_infinite]" />

//       {/* diagonal dots accent */}
//       <div className="pointer-events-none absolute -top-6 right-8 h-32 w-32 opacity-30 animate-[slideDots_10s_linear_infinite]">
//         <div className="grid grid-cols-5 gap-3">
//           {Array.from({ length: 25 }).map((_, i) => (
//             <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0f172a]/40" />
//           ))}
//         </div>
//       </div>

//       {/* header */}
//       <div className="max-w-5xl mx-auto mb-8">
//         <div className="flex items-center gap-3 mb-3">
//           <div className="h-9 w-9 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#edfdfd] font-bold text-xs">
//             PP
//           </div>
//           <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
//             {t("Vaccine & Deworming Alerts")}
//           </h1>
//         </div>
//         <p className="text-slate-600">
//           {t("Keep your pet’s health on track.")}{" "}
//           <span className="underline decoration-4 decoration-[#fdd14280]">
//             {t("Select a pet")}
//           </span>{" "}
//           {t("to see due dates and update doses.")}
//         </p>
//       </div>

//       {/* Pet Selector */}
//       <div className="mb-8 max-w-5xl mx-auto bg-white/85 backdrop-blur border border-white rounded-3xl shadow p-6 animate-[slideup_0.6s_ease-out]">
//         <label className="block text-sm font-medium text-slate-800 mb-2">
//           {t("Select Your Pet")}
//         </label>
//         <select
//           aria-label={t("Select Your Pet")}
//           value={selectedPet || ""}
//           onChange={(e) => setSelectedPet(Number(e.target.value))}
//           className="w-full md:w-1/3 px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
//         >
//           {Array.isArray(pets) &&
//             pets.map((pet) => (
//               <option key={pet.id} value={pet.id}>
//                 {pet.name} ({pet.species})
//               </option>
//             ))}
//         </select>
//       </div>

//       {/* Vaccine Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
//         {/* Rabies */}
//         <div className="relative bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 flex flex-col h-fit animate-[slideup_0.6s_ease-out]">
//           <h2 className="text-lg font-semibold text-slate-900 mb-3">
//             {t("Rabies")}
//           </h2>
//           <div className="flex-1 text-sm text-slate-700 space-y-1">
//             {getVaccineInfo("Rabies") ? (
//               <>
//                 <p>
//                   ● {t("Last dose on")} {getVaccineInfo("Rabies").administered_on}
//                 </p>
//                 <p>
//                   ● {t("Upcoming dose")} - {getVaccineInfo("Rabies").due_on || t("Not set")}
//                 </p>
//               </>
//             ) : (
//               <p>
//                 {t(
//                   "No vaccination record found. Rabies vaccine must be administered at 3 months of age and reboosted yearly."
//                 )}
//               </p>
//             )}
//           </div>
//           <button
//             onClick={() => handleUpdateDose("vaccination", "Rabies")}
//             aria-label={t("Update Last Dose for Rabies")}
//             className="mt-4 px-5 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px]"
//           >
//             {t("Update Last Dose")}
//           </button>

//           {/* tiny floating accent */}
//           <div className="pointer-events-none absolute -top-3 -right-3 h-8 w-8 bg-[#fdd142] rounded-full opacity-80 animate-[float_6s_ease-in-out_infinite]" />
//         </div>

//         {/* Flu */}
//         <div className="relative bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 flex flex-col h-fit animate-[slideup_0.6s_ease-out]">
//           <h2 className="text-lg font-semibold text-slate-900 mb-3">
//             {t("Flu")}
//           </h2>
//           <div className="flex-1 text-sm text-slate-700 space-y-1">
//             {getVaccineInfo("Flu") ? (
//               <>
//                 <p>
//                   ● {t("Last dose on")} {getVaccineInfo("Flu").administered_on}
//                 </p>
//                 <p>
//                   ● {t("Upcoming dose")} - {getVaccineInfo("Flu").due_on || t("Not set")}
//                 </p>
//               </>
//             ) : (
//               <p>
//                 {t(
//                   "No vaccination record found. Flu vaccine should be given at 2 months of age and reboosted yearly."
//                 )}
//               </p>
//             )}
//           </div>
//           <button
//             onClick={() => handleUpdateDose("vaccination", "Flu")}
//             aria-label={t("Update Last Dose for Flu")}
//             className="mt-4 px-5 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px]"
//           >
//             {t("Update Last Dose")}
//           </button>

//           {/* tiny floating accent */}
//           <div className="pointer-events-none absolute -top-3 -right-3 h-8 w-8 bg-[#fdd142] rounded-full opacity-80 animate-[float_6s_ease-in-out_infinite]" />
//         </div>

//         {/* Deworming */}
//         <div className="relative bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 flex flex-col sm:col-span-2 h-fit animate-[slideup_0.6s_ease-out]">
//           <h2 className="text-lg font-semibold text-slate-900 mb-3">
//             {t("Deworming")}
//           </h2>
//           <div className="flex-1 text-sm text-slate-700 space-y-1">
//             {getDewormingInfo() ? (
//               <>
//                 <p>
//                   ● {t("Last dose on")} {getDewormingInfo().administered_on}
//                 </p>
//                 <p>
//                   ● {t("Upcoming dose")} - {getDewormingInfo().due_on || t("Not set")}
//                 </p>
//               </>
//             ) : (
//               <p>{t("No deworming record found. Please provide details.")}</p>
//             )}
//           </div>

//           {/* Product selector */}
//           <label className="mt-4 text-sm text-slate-700">{t("Select Product")}</label>
//           <select
//             aria-label={t("Select Deworming Product")}
//             value={dewormProduct}
//             onChange={(e) => setDewormProduct(e.target.value)}
//             className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition mt-1"
//           >
//             <option value="">{t("-- Choose a product --")}</option>
//             <option value="Albendazole">{t("Albendazole")}</option>
//             <option value="Fenbendazole">{t("Fenbendazole")}</option>
//             <option value="Helminticide-L">{t("Helminticide-L")}</option>
//             <option value="Drontal">{t("Drontal")}</option>
//             <option value="Other">{t("Other")}</option>
//           </select>

//           <button
//             onClick={() => handleUpdateDose("deworming", dewormProduct)}
//             disabled={!dewormProduct}
//             aria-label={t("Update Last Deworming Dose")}
//             className="mt-4 px-5 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px] disabled:opacity-50"
//           >
//             {t("Update Last Dose")}
//           </button>

//           {/* tiny floating accent */}
//           <div className="pointer-events-none absolute -top-3 -right-3 h-8 w-8 bg-[#fdd142] rounded-full opacity-80 animate-[float_6s_ease-in-out_infinite]" />
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="mt-12 bg-white/85 backdrop-blur border border-white rounded-3xl shadow p-6 max-w-3xl mx-auto">
//         <h3 className="text-lg font-semibold text-slate-900 mb-3">
//           {t("Other Recommended Vaccines")}
//         </h3>
//         <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
//           <li>{t("Feline Panleukopenia (Distemper) – yearly booster")}</li>
//           <li>{t("Feline Calicivirus – yearly booster")}</li>
//           <li>{t("Feline Herpesvirus – yearly booster")}</li>
//           <li>{t("Optional: Feline Leukemia (FeLV) – for outdoor cats")}</li>
//         </ul>
//       </div>

//       {/* keyframes (mirrors LandingPage) */}
//       <style>{`
//         @keyframes slideup {
//           from { opacity: 0; transform: translateY(16px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes float {
//           0%, 100% { transform: translateY(0); }
//           50% { transform: translateY(-10px); }
//         }
//         @keyframes bouncey {
//           0%, 100% { transform: translateY(0) scale(1); }
//           50% { transform: translateY(-12px) scale(1.03); }
//         }
//         @keyframes spin {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }
//         @keyframes slideDots {
//           0% { transform: translateY(0) translateX(0); }
//           100% { transform: translateY(-30px) translateX(30px); }
//         }
//       `}</style>
//     </section>
//   );
// };

// export default VaccineAlert;
// // ...existing code...