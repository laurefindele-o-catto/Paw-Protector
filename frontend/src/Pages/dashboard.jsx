import { Link, useNavigate } from "react-router-dom";
import ProfilePictureCard from "../Components/profilePictureCard";
// import catGif from "../assets/giphy/cat.gif"; // if you keep it in src
import FeaturesSection from "../Components/FeaturesSection";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import apiConfig from "../config/apiConfig";

function Dashboard() {
    const navigate = useNavigate();
    const {isAuthenticated} = useAuth();
    useEffect(()=>{
        if(!isAuthenticated){
            navigate('/');
        }
    }, []);

    const token = localStorage.getItem('token');
    console.log("accesstoken: " + localStorage.getItem('token'));

    const demo = async()=>{
        try {
            console.log(`${apiConfig.baseURL}${apiConfig.pets.create}`);
            
            const response = await fetch(`${apiConfig.baseURL}${apiConfig.pets.create}`, {
                method: 'POST',
                headers:{
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "name": "Milo2",
                    "species": "cat",
                    "breed": "Local",
                    "sex": "male",
                    "birthdate": "2023-01-10",
                    "weight_kg": 3.8,
                    "avatar_url": null,
                    "is_neutered": false,
                    "notes": "Shy"
                })
            });
            const result = await response.json();
            console.log(result);
            
        } catch (error) {
            console.error(error)
        }
    }
    
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800" style={{ backgroundColor: "#FAF6E9" }}>
            {/* Top Bar */}
            <header className="flex justify-between items-center p-4">
                <div className="text-2xl font-bold text-indigo-600">🐾 PawPal</div>
                <Link to="/profile">
                    <ProfilePictureCard />
                </Link>
            </header>

            {/* Random Cat Fact */}
            <section className="p-6 text-center mt-4">
                <h2 className="text-lg italic text-gray-600">
                    {/* Replace with API call */}
                    "Cats sleep for 70% of their lives."
                </h2>
            </section>

            {/* Scrollable Row */}
            <FeaturesSection />

            <button onClick={()=>demo()}>
                Demo Method
            </button>

            {/* Bottom Bar */}

            <footer className="flex flex-col items-center p-4 mt-6">
                {/* Top row: call btn | cat gif | info btn */}

                <div className="w-full flex justify-between items-center">

                    {/* Cat gif in the middle */}
                    <div className="flex justify-center w-full">
                        <img
                            src="/giphy/cat playing a recorder.gif" // put your gif in public/ folder
                            alt="Cat"
                            className="h-16 w-auto"
                        />
                    </div>

                    {/* Info button */}
                    <a
                        href="/about"
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-600 transition transform hover:scale-110"
                        title="About"
                    >
                        i
                    </a>
                </div>

                {/* Bottom text */}
                <p className="mt-3 text-sm text-gray-500">
                    Leave a review at <a href="pawmeowmanool@gmail.com" className="text-indigo-600 underline">pawmeowmanool@gmail.com</a>
                </p>
            </footer>

            {/* Floating Call Button */}
            <a
                href="tel:+8801888548012"
                className="fixed bottom-12 left-12 bg-red-500 w-16 h-16 flex flex-col items-center justify-center rounded-full shadow-lg hover:bg-red-600 transition pulse-glow text-center"
            >
                <img src="/icons/call-icon.png" alt="Call" className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-semibold text-white leading-none">
                    Emergency
                </span>
            </a>


        </div>
    );
}

export default Dashboard;