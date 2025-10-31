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
                setPets(res.data);

                if (res.data.length > 0) setSelectedPet(res.data[0].id);
            } catch (err) {
                console.error("Failed to fetch pets", err);
            }
        };
        fetchPets();
    }, [userId]);

    // Fetch vaccinations + dewormings for selected pet

    useEffect(() => {
        if (!selectedPet) return;
        const fetchData = async () => {
            try {
                const vacRes = await axios.get(`/api/vaccinations/pet/${selectedPet}`);
                setVaccinations(vacRes.data);

                const dewRes = await axios.get(`/api/dewormings/pet/${selectedPet}`);
                setDewormings(dewRes.data);

            }
            catch (err) {
                console.error("Failed to fetch vaccination data", err);
            }
        };
        fetchData();
    }, [selectedPet]);

    //Update last dosage
    const handleUpdateDose = async (type, vaccineName) => {
        try {
            const today = new Date().toISOString().split("T")[0];

            if (type == "vaccination") {
                await axios.post('/api/vaccinations', {
                    pet_id: selectedPet,
                    vaccine_name: vaccineName,
                    administered_on: today,
                    notes: "Updated via app"
                });
            }
            else if (type === "deworming") {
                await axios.post(`/api/dewormings`, {
                    pet_id: selectedPet,
                    product_name: vaccineName, //user's choice of med for deworming
                    administered_on: today,
                    weight_based_dose: null,
                    notes: "Updated via app"
                });
            }

            //refresh data
            if (type === "vaccination") {
                const vacRes = await axios.get(`/api/vaccinations/pet/${selectedPet}`);
                setVaccinations(vacRes.data);
            } else {
                const dewRes = await axios.get(`/api/dewormings/pet/${selectedPet}`);
                setDewormings(dewRes.data);
            }
        } catch (err) {
            console.error("Failed to update dose", err);
        }
    };

    // Helper: get last + next dose for a vaccine
    const getVaccineInfo = (name) => {
        const record = vaccinations
            .filter((v) => v.vaccine_name.toLowerCase() === name.toLowerCase())
            .sort((a, b) => new Date(b.administered_on) - new Date(a.administered_on))[0];
        if (!record) return null;
        return record;
    };

    const getDewormingInfo = () => {
        if (!dewormings.length) return null;
        return dewormings.sort(
            (a, b) => new Date(b.administered_on) - new Date(a.administered_on)
        )[0];
    };


    return (
        <section className="px-6 py-8 bg-[#FAF6E9] min-h-screen">
            {/* Pet Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Your Pet
                </label>
                <select
                    value={selectedPet || ""}
                    onChange={(e) => setSelectedPet(e.target.value)}
                    className="w-full md:w-1/3 p-2 border rounded-md"
                >
                    {pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                            {pet.name} ({pet.species})
                        </option>
                    ))}
                </select>
            </div>

            {/* Vaccine Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Rabies */}
                <div className="bg-white shadow-md rounded-xl p-4 flex flex-col">
                    <h2 className="text-lg font-bold text-purple-700 mb-2">Rabies</h2>
                    <div className="flex-1 text-sm text-gray-700">
                        {getVaccineInfo("Rabies") ? (
                            <>
                                <p>● Last dose on {getVaccineInfo("Rabies").administered_on}</p>
                                <p>
                                    ● Upcoming dose - {getVaccineInfo("Rabies").due_on || "Not set"}
                                </p>
                            </>
                        ) : (
                            <p>We do not have any existing vaccination info. Please provide us with the details. Rabies vaccine must be administered to a kitten of 3 months age and reboosted every year.</p>
                        )}
                    </div>
                    <button
                        onClick={() => handleUpdateDose("vaccination", "Rabies")}
                        className="mt-3 bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                    >
                        Update Last Dose
                    </button>
                </div>

                {/* Flu */}
                <div className="bg-white shadow-md rounded-xl p-4 flex flex-col">
                    <h2 className="text-lg font-bold text-purple-700 mb-2">Flu</h2>
                    <div className="flex-1 text-sm text-gray-700">
                        {getVaccineInfo("Flu") ? (
                            <>
                                <p>● Last dose on {getVaccineInfo("Flu").administered_on}</p>
                                <p>
                                    ● Upcoming dose - {getVaccineInfo("Flu").due_on || "Not set"}
                                </p>
                            </>
                        ) : (
                            <p>We do not have any existing vaccination info. Please provide us with the details. It is to be noted that flu vaccine has to be administered when a kitten becomes 2 months old and reboosted every year.</p>
                        )}
                    </div>
                    <button
                        onClick={() => handleUpdateDose("vaccination", "Flu")}
                        className="mt-3 bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                    >
                        Update Last Dose
                    </button>
                </div>

                {/* Deworming */}
                <div className="bg-white shadow-md rounded-xl p-4 flex flex-col md:col-span-2">
                    <h2 className="text-lg font-bold text-purple-700 mb-2">Deworming</h2>
                    <div className="flex-1 text-sm text-gray-700">
                        {getDewormingInfo() ? (
                            <>
                                <p>● Last dose on {getDewormingInfo().administered_on}</p>
                                <p>
                                    ● Upcoming dose - {getDewormingInfo().due_on || "Not set"}
                                </p>
                            </>
                        ) : (
                            <p>We do not have any existing deworming info. Please provide us with the details.</p>
                        )}
                    </div>

                    {/* Product selector */}
                    <label className="mt-3 text-sm text-gray-600">Select Product</label>
                    <select
                        value={dewormProduct}
                        onChange={(e) => setDewormProduct(e.target.value)}
                        className="border rounded p-2 mt-1"
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
                        className="mt-3 bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                        Update Last Dose
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-8 text-center text-gray-600 text-sm">
                Here are other vet recommended vaccines for your pet.
            </footer>
        </section>
    );
};

export default VaccineAlert;
