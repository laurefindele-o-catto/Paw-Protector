import PhotoCard from "../Components/profilePictureCard";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import apiConfig from "../config/apiConfig";

// Get user from localStorage and determine avatar URL
let avatarUrl = null;
let userId = null;

const placeholder = "/placeholder.png";

function ProfilePage() {
    const [user, setUser]= useState(null);
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [address, setAddress] = useState("");
    const [pets, setPets] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const token = localStorage.getItem('token');
    const fileInputRef = useRef();
    

    // Preload user info from localStorage
    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (user) {
                setName(user.full_name || "");
                setContact(user.email || "");
            }
            console.log(user.id);
            setUser(user);
        } catch (e) {
            setName("");
            setContact("");
        }
    }, []);

    const getPets = async () => {
        try {
            const response = await fetch(`${apiConfig.baseURL}/api/pets`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });
            const result = await response.json();
            setPets(result.pets || []);
        } catch (error) {
            console.error(error);
            setPets([]);
        }
    };

    useEffect(() => {
        getPets();
    }, []);

    // Handle photo click
    const handlePhotoClick = () => {
        fileInputRef.current.click();
    };

    // Handle file selection
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            alert("User ID not found.");
            return;
        }
        const formData = new FormData();
        formData.append("full_name", name);
        formData.append("email", contact);
        formData.append("address", address);
        if (selectedFile) {
            formData.append("avatar", selectedFile);
        }
        try {
            console.log(`${apiConfig.baseURL}${apiConfig.updateProfile(user.id)}`);
            const response = await fetch(
                `${apiConfig.baseURL}${apiConfig.updateProfile(user.id)}`,
                {
                    method: "POST", // or "PUT" if your API expects it
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        // Do NOT set Content-Type for FormData
                    },
                    body: formData,
                }
            );
            const result = await response.json();
            if (result && result.user) {
                localStorage.setItem("user", JSON.stringify(result.user));
                alert("Profile updated!");
                window.location.reload();
            } else {
                alert("Failed to update profile.");
            }
        } catch (error) {
            alert("Failed to update profile.");
        }
    };

    return (
        <div className="bg-gradient-to-br from-[#FFFDF6] to-[#f9fafb] min-h-screen flex flex-col items-center pt-16 px-4">
            {/* Profile Picture */}
            <div
                className="absolute top-6 right-6 animate-fade-in cursor-pointer"
                onClick={handlePhotoClick}
                title="Click to change photo"
            >
                <PhotoCard avatarUrl={selectedFile ? URL.createObjectURL(selectedFile) : (avatarUrl || placeholder)} />
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />
            </div>

            {/* Title */}
            <h1 className="text-5xl font-extrabold text-gray-800 text-center font-sans mb-10 tracking-tight animate-fade-in">
                Personal Information
            </h1>

            {/* Form */}
            <form
                className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg flex flex-col gap-6 border border-gray-100 animate-slide-up"
                onSubmit={handleSubmit}
            >
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        placeholder="Enter Name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        Contact
                    </label>
                    <input
                        type="text"
                        value={contact}
                        onChange={e => setContact(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        placeholder="Enter Contact"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                        Address
                    </label>
                    <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        placeholder="Enter Address"
                    />
                </div>
                <button
                    type="submit"
                    className="self-end px-6 py-3 text-sm rounded bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition"
                >
                    Submit
                </button>
            </form>

            {/* Pets Section */}
            <div className="w-full max-w-lg mt-14 border-t border-gray-200 pt-8">
                <h2 className="text-3xl font-semibold mb-6 text-gray-800 font-sans animate-fade-in">
                    Your Pets
                </h2>
                {pets.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">Currently no pets added.</div>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                        {pets.map((pet, idx) => (
                            <div key={pet.id || idx} className={`animate-fade-in delay-${100 * (idx + 1)}`}>
                                <PhotoCard
                                    name={pet.name}
                                    avatarUrl={pet.avatar_url || placeholder}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Add Button */}
            <Link to="/addPet">
                <button
                    className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-lg transition-transform duration-200 hover:scale-110 hover:shadow-2xl"
                    style={{ backgroundColor: "#B6CEB4" }}
                    aria-label="Add Pet"
                >
                    <span className="text-white text-3xl font-bold">+</span>
                </button>
            </Link>
            
        </div>
    );
}

export default ProfilePage;
