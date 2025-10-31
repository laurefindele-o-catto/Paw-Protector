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
                    product_name: name, // user’s choice
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
            .sort(
                (a, b) =>
                    new Date(b.administered_on) - new Date(a.administered_on)
            )[0];
        return record || null;
    };

    const getDewormingInfo = () => {
        if (!dewormings.length) return null;
        return dewormings.sort(
            (a, b) => new Date(b.administered_on) - new Date(a.administered_on)
        )[0];
    };

    return (
        <section className="px-6 py-10 bg-gray-50 min-h-screen">
            {/* Pet Selector */}
            <div className="mb-8 max-w-5xl mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Your Pet
                </label>
                <select
                    value={selectedPet || ""}
                    onChange={(e) => setSelectedPet(Number(e.target.value))}
                    className="w-full md:w-1/3 p-2 border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
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
                <div className="bg-white shadow rounded-lg p-6 flex flex-col h-fit">
                    <h2 className="text-lg font-semibold text-purple-700 mb-3">Rabies</h2>
                    <div className="flex-1 text-sm text-gray-700 space-y-1">
                        {getVaccineInfo("Rabies") ? (
                            <>
                                <p>● Last dose on {getVaccineInfo("Rabies").administered_on}</p>
                                <p>
                                    ● Upcoming dose - {getVaccineInfo("Rabies").due_on || "Not set"}
                                </p>
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
                        className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
                    >
                        Update Last Dose
                    </button>
                </div>

                {/* Flu */}
                <div className="bg-white shadow rounded-lg p-6 flex flex-col h-fit">
                    <h2 className="text-lg font-semibold text-purple-700 mb-3">Flu</h2>
                    <div className="flex-1 text-sm text-gray-700 space-y-1">
                        {getVaccineInfo("Flu") ? (
                            <>
                                <p>● Last dose on {getVaccineInfo("Flu").administered_on}</p>
                                <p>
                                    ● Upcoming dose - {getVaccineInfo("Flu").due_on || "Not set"}
                                </p>
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
                        className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
                    >
                        Update Last Dose
                    </button>
                </div>

                {/* Deworming */}
                <div className="bg-white shadow rounded-lg p-6 flex flex-col sm:col-span-2 h-fit">
                    <h2 className="text-lg font-semibold text-purple-700 mb-3">Deworming</h2>
                    <div className="flex-1 text-sm text-gray-700 space-y-1">
                        {getDewormingInfo() ? (
                            <>
                                <p>● Last dose on {getDewormingInfo().administered_on}</p>
                                <p>
                                    ● Upcoming dose - {getDewormingInfo().due_on || "Not set"}
                                </p>
                            </>
                        ) : (
                            <p>No deworming record found. Please provide details.</p>
                        )}
                    </div>

                    {/* Product selector */}
                    <label className="mt-4 text-sm text-gray-600">Select Product</label>
                    <select
                        value={dewormProduct}
                        onChange={(e) => setDewormProduct(e.target.value)}
                        className="border rounded-md p-2 mt-1 shadow-sm focus:ring-purple-500 focus:border-purple-500"
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
                        className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        Update Last Dose
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 bg-white shadow rounded-lg p-6 max-w-3xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Other Recommended Vaccines
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Feline Panleukopenia (Distemper) – yearly booster</li>
                    <li>Feline Calicivirus – yearly booster</li>
                    <li>Feline Herpesvirus – yearly booster</li>
                    <li>Optional: Feline Leukemia (FeLV) – for outdoor cats</li>
                </ul>
            </div>
        </section>
    );
};

export default VaccineAlert;