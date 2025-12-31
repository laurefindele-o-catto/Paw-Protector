import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import ProfilePictureCard from '../components/profilePictureCard';
import { usePet } from '../context/PetContext';
import { useAutoTranslate } from 'react-autolocalise';
const placeholder = "/placeholder.png";

function Header({ translationState, onTranslationToggle }) {
    const { loading, logout, user } = useAuth();
    const {currentPet} = usePet();
    const navigate = useNavigate();
    const { t: translate } = useAutoTranslate();

    // Use translation state from parent or default to true
    const useTranslation = translationState ?? true;

    // fallback translator
    const t = useTranslation && translate ? translate : (s) => s;

    // Handle translation toggle
    const handleTranslationToggle = () => {
        const newState = !useTranslation;
        if (onTranslationToggle) {
            onTranslationToggle(newState);
        }
    };

    // console.log(currentPet);
    
    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    // Button config for nav
    const navLinks = [
        { to: '/dashboard', label: ('Dashboard') },
        { to: '/petcare', label: ('Petcare') },
        { to: '/assistant', label: ('Assistant') },
        { to: '/find-a-vet', label: ('Vet Finder') }
    ];

    return (
        <header className="fixed top-0 left-0 w-full bg-white/30 backdrop-blur-md border-b border-white shadow z-30">
            <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
                {/* Logo left */}
                <Link to='/dashboard'>
                    <div className="flex items-center gap-3">
                        <div className="h-15 w-15 rounded-xl overflow-hidden animate-[popin_0.5s_ease]">
                            <img src="/logo.png" alt="PawPal logo" className="h-full w-full object-contain" />
                        </div>
                        <div className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                            🐾 {t('PawPal')}
                        </div>
                    </div>
                </Link>
                {/* Left nav buttons styled as pills, left-aligned */}
                <nav className="flex gap-2 ml-6 justify-start">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#fdd142]/40 text-[#0f172a] font-semibold text-sm transition"
                            aria-label={link.label}
                        >
                            {link.icon && (
                                <img src={link.icon} alt="" className="w-5 h-5" />
                            )}
                            {link.label}
                        </Link>
                    ))}
                </nav>
                {/* Right side: translation toggle, logout then profile */}
                <div className="flex items-center gap-4">
                    {/* Translation Toggle Button */}
                    {/* <button
                        onClick={handleTranslationToggle}
                        className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-medium hover:bg-gray-700 transition"
                        aria-label="Toggle language"
                    >
                        {useTranslation ? "BN" : "EN"}
                    </button> */}
                    
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 bg-red-700 text-[#ffffff] rounded-lg shadow hover:bg-gray-700 transition disabled:opacity-60"
                        aria-label={t("Logout")}
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
                        {t('Logout')}
                    </button>
                    <Link to="/profile" aria-label={t("Profile")} className="shrink-0">
                        <ProfilePictureCard
                            avatarUrl={user?.avatar_url ? user.avatar_url : placeholder}
                            name={user?.username}
                        />
                    </Link>
                    {/* Pet Profile link */}
                    <Link
                        to="/pet-profile"
                        className="px-3 py-2 rounded-lg text-sm hover:bg-slate-50"
                        aria-label={t("Pet Profile")}
                    >
                        <ProfilePictureCard
                            avatarUrl={currentPet?.avatar_url ? currentPet.avatar_url : placeholder}
                            name={currentPet?.name}
                        />
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default Header;