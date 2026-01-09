import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import apiConfig from "../config/apiConfig";
import { useNavigate } from "react-router-dom";
import Header from '../components/Header'
// import { CheckCircleIcon } from '@heroicons/react/24/solid'; // If you use Heroicons, or use any SVG

const VaccineAlert = () => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [dewormings, setDewormings] = useState([]);
  const [newVaccineDate, setNewVaccineDate] = useState("");
  const [newDewormDate, setNewDewormDate] = useState("");
  const [vaccineName, setVaccineName] = useState("Rabies");
  const [dewormProduct, setDewormProduct] = useState("");
  const [savingVaccine, setSavingVaccine] = useState(false);
  const [savingDeworm, setSavingDeworm] = useState(false);
  const [successVaccine, setSuccessVaccine] = useState(false);
  const [successDeworm, setSuccessDeworm] = useState(false);

  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${apiConfig.baseURL}/api/pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setPets(data.pets || []);
        if (data.pets?.length) setSelectedPet(data.pets[0].id);
      } catch {
        setPets([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedPet) {
      setVaccinations([]);
      setDewormings([]);
      return;
    }
    (async () => {
      const token = localStorage.getItem("token");
      try {
        const vacRes = await fetch(`${apiConfig.baseURL}/api/care/vaccinations/${selectedPet}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const vacData = await vacRes.json();
        setVaccinations(vacData.vaccinations || vacData || []);
        const dewRes = await fetch(`${apiConfig.baseURL}/api/care/dewormings/${selectedPet}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dewData = await dewRes.json();
        setDewormings(dewData.dewormings || dewData || []);
      } catch {
        setVaccinations([]);
        setDewormings([]);
      }
    })();
  }, [selectedPet]);

  const today = new Date().toISOString().slice(0, 10);
  const classify = (due) => {
    if (!due) return null;
    if (due < today) return "overdue";
    // mark upcoming if within next 30 days
    const diff = (new Date(due) - new Date(today)) / (1000 * 60 * 60 * 24);
    if (diff <= 30) return "due";
    return null;
  };

  const vaccineDueItems = vaccinations
    .filter(v => classify(v.due_on))
    .map(v => ({
      type: "vaccine",
      name: v.vaccine_name,
      due_on: v.due_on,
      status: classify(v.due_on)
    }));

  const dewormDueItems = dewormings
    .filter(d => classify(d.due_on))
    .map(d => ({
      type: "deworm",
      name: d.product_name || "Deworming",
      due_on: d.due_on,
      status: classify(d.due_on)
    }));

  const overdue = [...vaccineDueItems, ...dewormDueItems].filter(i => i.status === "overdue")
    .sort((a, b) => new Date(a.due_on) - new Date(b.due_on));
  const dueSoon = [...vaccineDueItems, ...dewormDueItems].filter(i => i.status === "due")
    .sort((a, b) => new Date(a.due_on) - new Date(b.due_on));

  const handleAddVaccination = async () => {
    if (!selectedPet || !vaccineName || !newVaccineDate) return;
    setSavingVaccine(true);
    setSuccessVaccine(false);
    const token = localStorage.getItem("token");
    await fetch(`${apiConfig.baseURL}/api/care/vaccinations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        pet_id: selectedPet,
        vaccine_name: vaccineName,
        administered_on: newVaccineDate,
        notes: "Updated via alerts page"
      })
    });
    setNewVaccineDate("");
    // refresh
    const vacRes = await fetch(`${apiConfig.baseURL}/api/care/vaccinations/${selectedPet}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const vacData = await vacRes.json();
    setVaccinations(vacData.vaccinations || vacData || []);
    setSavingVaccine(false);
    setSuccessVaccine(true);
    setTimeout(() => setSuccessVaccine(false), 1800);

    // Update localStorage summary
    addVaccinationAndDeworming(
      {
        id: Date.now(),
        vaccine_name: vaccineName,
        administered_on: newVaccineDate,
        due_on: newVaccineDate, // or logic to set due date
        notes: "Updated via alerts page"
      },
      null // no deworming info
    );
  };

  const handleAddDeworming = async () => {
    if (!selectedPet || !dewormProduct || !newDewormDate) return;
    setSavingDeworm(true);
    setSuccessDeworm(false);
    const token = localStorage.getItem("token");
    await fetch(`${apiConfig.baseURL}/api/care/dewormings`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        pet_id: selectedPet,
        product_name: dewormProduct,
        administered_on: newDewormDate,
        notes: "Updated via alerts page"
      })
    });
    setNewDewormDate("");
    const dewRes = await fetch(`${apiConfig.baseURL}/api/care/dewormings/${selectedPet}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dewData = await dewRes.json();
    setDewormings(dewData.dewormings || dewData || []);
    setSavingDeworm(false);
    setSuccessDeworm(true);
    setTimeout(() => setSuccessDeworm(false), 1800);

    // Update localStorage summary
    addVaccinationAndDeworming(
      null, // no vaccination info
      {
        id: Date.now(),
        product_name: dewormProduct,
        administered_on: newDewormDate,
        due_on: newDewormDate, // or logic to set due date
        notes: "Updated via alerts page"
      }
    );
  };

  // Add a new vaccination and deworming to current_pet_summary in localStorage
  function addVaccinationAndDeworming(newVaccine, newDeworm) {
    const key = "current_pet_summary";
    let summary = {};
    try {
      summary = JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      summary = {};
    }

    // Vaccination
    if (newVaccine) {
      if (!summary.vaccinations) summary.vaccinations = { recent: [], nextDue: null };
      summary.vaccinations.recent = Array.isArray(summary.vaccinations.recent)
        ? [...summary.vaccinations.recent, newVaccine]
        : [newVaccine];
      summary.vaccinations.nextDue = newVaccine; // or logic to pick the soonest due
    }

    // Deworming
    if (newDeworm) {
      if (!summary.dewormings) summary.dewormings = { recent: [], nextDue: null };
      summary.dewormings.recent = Array.isArray(summary.dewormings.recent)
        ? [...summary.dewormings.recent, newDeworm]
        : [newDeworm];
      summary.dewormings.nextDue = newDeworm; // or logic to pick the soonest due
    }

    localStorage.setItem(key, JSON.stringify(summary));
  }

  return (
    <>
      <Header/>
      <main id="main-content" role="main" tabIndex="-1">
      <section className="min-h-screen bg-white text-slate-900 px-6 py-8 mt-32">
        <div className="max-w-5xl mx-auto flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("Vaccine & Deworming Alerts")}</h1>

        </div>

        <div className="max-w-5xl mx-auto mb-6">
          <label className="block text-sm font-medium mb-1">{t("Select Pet")}</label>
          <select
            value={selectedPet || ""}
            onChange={(e) => setSelectedPet(Number(e.target.value))}
            className="w-full md:w-1/3 px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            {pets.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
            ))}
          </select>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-md p-4" role="region" aria-live="assertive" aria-label="Overdue vaccinations">
            <h2 className="text-sm font-semibold mb-3">{t("Overdue")}</h2>
            {overdue.length ? (
              <ul className="space-y-2 text-sm">
                {overdue.map((o, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span className="text-red-700 font-medium">{t(o.name)}</span>
                    <span className="text-red-600">{t("Due")} {o.due_on}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-slate-500">{t("No overdue items.")}</p>}
          </div>
          <div className="border border-slate-200 rounded-md p-4" role="region" aria-live="polite" aria-label="Upcoming vaccinations">
            <h2 className="text-sm font-semibold mb-3">{t("Due Soon (≤30d)")}</h2>
              {dueSoon.length ? (
                <ul className="space-y-2 text-sm">
                  {dueSoon.map((d, i) => (
                    <li key={i} className="flex justify-between items-center">
                      <span className="text-amber-700 font-medium">{t(d.name)}</span>
                      <span className="text-amber-600">{t("Due")} {d.due_on}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-slate-500">{t("No upcoming items in next 30 days.")}</p>}
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 mt-8">
          <div className="border border-slate-200 rounded-md p-4">
            <h3 className="text-sm font-semibold mb-3">{t("Add Vaccination Dose")}</h3>
            <label className="block text-xs mb-1">{t("Vaccine Name")}</label>
            <select
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option>Rabies</option>
              <option>Flu</option>
              <option>FVRCP</option>
              <option>FeLV</option>
              <option>Other</option>
            </select>
            <label className="block text-xs mb-1">{t("Administered On")}</label>
            <input
              type="date"
              value={newVaccineDate}
              onChange={(e) => setNewVaccineDate(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <button
              onClick={handleAddVaccination}
              disabled={!newVaccineDate || savingVaccine}
              className="w-full px-4 py-2 rounded-md bg-[#0f172a] text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
            >
              {savingVaccine ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {t("Saving...")}
                </span>
              ) : successVaccine ? (
                <span className="flex items-center gap-2 text-emerald-200">
                  {/* <CheckCircleIcon className="h-5 w-5" /> */}
                  {t("Saved!")}
                </span>
              ) : (
                t("Save")
              )}
            </button>
          </div>

          <div className="border border-slate-200 rounded-md p-4">
            <h3 className="text-sm font-semibold mb-3">{t("Add Deworming Dose")}</h3>
            <label className="block text-xs mb-1">{t("Product")}</label>
            <select
              value={dewormProduct}
              onChange={(e) => setDewormProduct(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="">{t("-- Choose --")}</option>
              <option>Albendazole</option>
              <option>Fenbendazole</option>
              <option>Helminticide-L</option>
              <option>Drontal</option>
              <option>Other</option>
            </select>
            <label className="block text-xs mb-1">{t("Administered On")}</label>
            <input
              type="date"
              value={newDewormDate}
              onChange={(e) => setNewDewormDate(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
            <button
              onClick={handleAddDeworming}
              disabled={!dewormProduct || !newDewormDate || savingDeworm}
              className="w-full px-4 py-2 rounded-md bg-[#0f172a] text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
            >
              {savingDeworm ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {t("Saving...")}
                </span>
              ) : successDeworm ? (
                <span className="flex items-center gap-2 text-emerald-200">
                  {/* <CheckCircleIcon className="h-5 w-5" /> */}
                  {t("Saved!")}
                </span>
              ) : (
                t("Save")
              )}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-10 border border-slate-200 rounded-md p-4">
          <h3 className="text-sm font-semibold mb-3">{t("Recommended Core Vaccines")}</h3>
          <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
            <li>{t("Rabies – follow local law")}</li>
            <li>{t("FVRCP – kitten series then q3y")}</li>
            <li>{t("FeLV – if outdoor or multi-cat risk")}</li>
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">
            {t("Always confirm schedule with your veterinarian.")}
          </p>
        </div>
    </section>
    </main>
    </>
  );
};

export default VaccineAlert;