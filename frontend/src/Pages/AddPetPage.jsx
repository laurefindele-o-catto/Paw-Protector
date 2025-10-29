import React, { useState } from "react";

function AddPetPage() {
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState("");
  const [diseases, setDiseases] = useState([""]);
  const [vaccines, setVaccines] = useState([""]);
  const [spayed, setSpayed] = useState(false);
  const [image, setImage] = useState(null);

  const handleAddDisease = () => setDiseases([...diseases, ""]);
  const handleDiseaseChange = (i, value) => {
    const updated = [...diseases];
    updated[i] = value;
    setDiseases(updated);
  };

  const handleAddVaccine = () => setVaccines([...vaccines, ""]);
  const handleVaccineChange = (i, value) => {
    const updated = [...vaccines];
    updated[i] = value;
    setVaccines(updated);
  };

  const handleImageUpload = (e) => {
    if (e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

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
      <form className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-5xl border border-gray-100">
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
            <input
              key={i}
              type="text"
              value={disease}
              onChange={e => handleDiseaseChange(i, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2 focus:ring-2 focus:ring-red-300 transition"
              placeholder="Enter Disease"
            />
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
          {vaccines.map((vaccine, i) => (
            <input
              key={i}
              type="text"
              value={vaccine}
              onChange={e => handleVaccineChange(i, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2 focus:ring-2 focus:ring-green-300 transition"
              placeholder="Enter Vaccine"
            />
          ))}
          <button
            type="button"
            onClick={handleAddVaccine}
            className="text-blue-600 text-sm hover:underline"
          >
            + Add another vaccine
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="mt-10 bg-blue-500 text-white py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 transition"
        >
          Save Pet
        </button>
      </form>
    </div>
  );
}

export default AddPetPage;