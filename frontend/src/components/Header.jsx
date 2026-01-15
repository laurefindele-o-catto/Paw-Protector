import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import ProfilePictureCard from '../components/profilePictureCard';
import { usePet } from '../context/PetContext';
import { useLanguage } from '../context/LanguageContext';
import FloatingFeatureMenu from './FloatingFeatureMenu';
const placeholder = "/placeholder.png";

function Header() {
    const { loading, logout, user } = useAuth();
    const {currentPet} = usePet();
    const navigate = useNavigate();
    const { t, useTranslation, toggleLanguage } = useLanguage();

    // console.log(currentPet);
    
    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    // Button config for nav
    const navLinks = [
        { to: '/dashboard', label: ('Dashboard') },
        { to: '/assistant', label: ('Assistant') },
        { to: '/find-a-vet', label: ('Vet Finder') }
    ];

    return (
        <>
        <header className="fixed top-0 left-0 w-full bg-white/30 backdrop-blur-md border-b border-white shadow z-30" role="banner">
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
                <nav className="flex gap-2 ml-6 justify-start" role="navigation" aria-label="Main navigation">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#fdd142]/40 text-[#0f172a] font-semibold text-sm transition focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
                            aria-label={link.label}
                        >
                            {link.icon && (
                                <img src={link.icon} alt="" className="w-5 h-5" />
                            )}
                            {link.label}
                        </Link>
                    ))}

                    <Link
                        to="/pawpal"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#fdd142]/40 text-[#0f172a] font-semibold text-sm transition focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
                        aria-label={t('PawPal')}
                    >
                        {t('PawPal')}
                    </Link>
                </nav>
                {/* Right side: translation toggle, logout then profile */}
                <div className="flex items-center gap-4">
                    {/* Translation Toggle Button */}
                    <button
                        onClick={toggleLanguage}
                        className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-medium hover:bg-gray-700 transition"
                        aria-label="Toggle language"
                        title={useTranslation ? "Switch to English" : "Switch to Bangla"}
                    >
                        {useTranslation ? "EN" : "বাং"}
                    </button>
                    
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
                            name={currentPet?.name || "Pet Photo"}
                        />
                    </Link>
                </div>
            </div>

        </header>

        <FloatingFeatureMenu />
        </>
    );
}

export default Header;