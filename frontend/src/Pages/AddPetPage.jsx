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
  //set the user when mounted
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
    <div className="bg-gradient-to-br from-[#FFFDF6] to-[#f9fafb] min-h-screen flex flex-col items-center pt-16 px-6">
      {/* Title */}
      <h1 className="text-5xl font-extrabold text-gray-800 text-center font-sans mb-10 tracking-tight">
        Add Pet
      </h1>

      {/* Image Upload Section */}
      <div className="flex flex-col items-center mb-10">
        <label className="w-40 h-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-blue-400 transition">
          {image ? (
            <img
              src={image}
              alt="Pet Preview"
              className="w-40 h-40 object-cover rounded-full"
            />
          ) : (
            <span className="text-gray-500">Upload Photo</span>
          )}
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      </div>

      {/* Two-column Form */}
      <form className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-5xl border border-gray-100"
        onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter Pet Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Breed</label>
              <input
                type="text"
                value={breed}
                onChange={e => setBreed(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter Breed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Age</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter Age"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 transition"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male ♂</option>
                <option value="Female">Female ♀</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Enter Weight"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={spayed}
                onChange={e => setSpayed(e.target.checked)}
                className="h-5 w-5 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
              />
              <label className="text-gray-700">Spayed / Neutered</label>
            </div>
          </div>
        </div>

        {/* Known Diseases */}
        <div className="mt-10">
          <label className="block text-sm font-medium text-gray-600 mb-2">Known Diseases</label>
          {diseases.map((disease, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={disease.disease_name}
                onChange={e => handleDiseaseChange(i, "disease_name", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-300 transition"
                placeholder="Disease Name"
              />
              <input
                type="text"
                value={disease.symptoms}
                onChange={e => handleDiseaseChange(i, "symptoms", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-300 transition"
                placeholder="Symptoms"
              />
              {/* Severity dropdown with only allowed options */}
              <select
                value={disease.severity}
                onChange={e => handleDiseaseChange(i, "severity", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-300 transition"
              >
                <option value="">Select Severity</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
              <select
                value={disease.status}
                onChange={e => handleDiseaseChange(i, "status", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-300 transition"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-300 transition"
              />
              <input
                type="text"
                value={disease.notes}
                onChange={e => handleDiseaseChange(i, "notes", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-300 transition"
                placeholder="Notes"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddDisease}
            className="text-blue-600 text-sm hover:underline"
          >
            + Add another disease
          </button>
        </div>

        {/* Vaccines */}
        <div className="mt-8">
          <label className="block text-sm font-medium text-gray-600 mb-2">Vaccines Given</label>
          {["rabies", "flu", "deworming"].map((vaccine) => (
            <div key={vaccine} className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                checked={vaccines[vaccine].checked}
                onChange={() => handleVaccineCheck(vaccine)}
                id={vaccine}
                className="h-5 w-5 text-blue-500 focus:ring-blue-400 border-gray-300 rounded"
              />
              <label htmlFor={vaccine} className="capitalize text-gray-700">
                {vaccine === "rabies" ? "Rabies" : vaccine === "flu" ? "Flu" : "Deworming"}
              </label>
              {vaccines[vaccine].checked && (
                <input
                  type="date"
                  value={vaccines[vaccine].date}
                  onChange={e => handleVaccineDate(vaccine, e.target.value)}
                  className="ml-4 border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-300 transition"
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            backgroundColor: loading ? "#9DB89B" : (isHovered ? "#9DB89B" : "#B6CEB4"),
            transition: "background-color 0.3s ease",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
          className="mt-10 text-white py-3 px-6 rounded-lg shadow-md flex items-center justify-center gap-2"
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
  );
}

export default AddPetPage;