import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import ProfilePictureCard from '../components/profilePictureCard';
import { usePet } from '../context/PetContext';
const placeholder = "/placeholder.png";

function VetHeader() {
    const { loading, logout, user } = useAuth();
    const {currentPet} = usePet();
    const navigate = useNavigate();

    // console.log(currentPet);
    
    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <header className="fixed top-0 left-0 w-full bg-white/30 backdrop-blur-md border-b border-white shadow z-30">
            <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
                {/* Logo left */}
                <Link to='/dashboard'>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#edfdfd] font-bold text-xs select-none">
                            PP
                        </div>
                        <div className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                            🐾 PawPal
                        </div>
                    </div>
                </Link>
                {/* Right side: logout then profile */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 bg-red-700 text-[#ffffff] rounded-lg shadow hover:bg-gray-700 transition disabled:opacity-60"
                        aria-label="Logout"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.2}
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Logout
                    </button>
                    <Link to="/vetprofile" aria-label="Profile" className="shrink-0">
                        <ProfilePictureCard
                            avatarUrl={user?.avatar_url ? user.avatar_url : placeholder}
                            name={user?.username}
                        />
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default VetHeader;