// import React, {useState} from "react";
// function ProfilePage(){
//     const[name, setName]= useState("Enter Name");
//     const[contact, setContanct]= useState("Enter Contact");
//     const[address, setAddress]= useState("Enter Address");
//     return(
//         <div className="bg-[#FFFDF6] min-h-screen">
//            <h1 className="text-4xl font-bold text-center mt-25 font-sans">Personal Information</h1>
//         </div>
//     );
// }

// export default ProfilePage;
// import PhotoCard from "../Components/profilePictureCard";
// import React, {useState} from "react";
// function ProfilePage(){
//     const [name, setName] = useState("");
//     const [contact, setContact] = useState("");
//     const [address, setAddress] = useState("");

//     return(
//         <div className="bg-[#FFFDF6] min-h-screen flex flex-col items-center pt-12">
//             <div className="absolute top-4 right-4">
//                 <PhotoCard />
//             </div>
//             <h1 className="text-4xl font-bold text-center mt-8 font-sans mb-8">Personal Information</h1>
//             <form className="bg-white p-8 rounded shadow-md w-full max-w-md flex flex-col gap-6">
//                 <div>
//                     <label className="block text-lg font-sans mb-2">Name</label>
//                     <input
//                         type="text"
//                         value={name}
//                         onChange={e => setName(e.target.value)}
//                         className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
//                         placeholder="Enter Name"
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-lg font-sans mb-2">Contact</label>
//                     <input
//                         type="text"
//                         value={contact}
//                         onChange={e => setContact(e.target.value)}
//                         className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
//                         placeholder="Enter Contact"
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-lg font-sans mb-2">Address</label>
//                     <input
//                         type="text"
//                         value={address}
//                         onChange={e => setAddress(e.target.value)}
//                         className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
//                         placeholder="Enter Address"
//                     />
//                 </div>

//             </form>
//             <div className="w-full max-w-md mt-10">
//                 <h2 className="text-2xl font-semibold mb-4 font-sans">Your pets:</h2>
//                 <div className="flex gap-4 flex-wrap justify-center">
//                     <PhotoCard name="Chonk"/>
//                     <PhotoCard name="Baby Food"/>
//                     <PhotoCard name="Mits"/>
//                     <PhotoCard name="Edur"/>
//                 </div>
//             </div>
//             <button
//                 className="fixed bottom-8 right-8 w-20 h-20 rounded-full bg-red-500 text-white text-base flex items-center justify-center shadow-lg hover:bg-red-600 transition"
//                 aria-label="Add Pet"
//                 >
//             Add Pet
//         </button>

//         </div>
//     );
// }

// export default ProfilePage;
import PhotoCard from "../Components/profilePictureCard";
import React, { useState } from "react";
import { Link } from "react-router-dom";

function ProfilePage() {
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [address, setAddress] = useState("");

    return (
        <div className="bg-gradient-to-br from-[#FFFDF6] to-[#f9fafb] min-h-screen flex flex-col items-center pt-16 px-4">
            {/* Profile Picture */}
            <div className="absolute top-6 right-6 animate-fade-in">
                <PhotoCard />
            </div>

            {/* Title */}
            <h1 className="text-5xl font-extrabold text-gray-800 text-center font-sans mb-10 tracking-tight animate-fade-in">
                Personal Information
            </h1>

            {/* Form */}
            <form className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg flex flex-col gap-6 border border-gray-100 animate-slide-up">
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
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                    <div className="animate-fade-in delay-100"><PhotoCard name="Chonk" /></div>
                    <div className="animate-fade-in delay-200"><PhotoCard name="Baby Food" /></div>
                    <div className="animate-fade-in delay-300"><PhotoCard name="Mits" /></div>
                    <div className="animate-fade-in delay-400"><PhotoCard name="Edur" /></div>
                </div>
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
