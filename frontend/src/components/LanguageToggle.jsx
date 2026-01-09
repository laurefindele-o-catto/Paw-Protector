import React from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Standalone Language Toggle Component
 * Can be used anywhere in the app to toggle between English and Bangla
 */
export default function LanguageToggle({ className = "" }) {
    const { useTranslation, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className={`px-3 py-1.5 rounded-full bg-black text-white text-xs font-medium hover:bg-gray-700 transition focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2 ${className}`}
            aria-label="Toggle language"
            title={useTranslation ? "Switch to English" : "Switch to Bangla"}
        >
            {useTranslation ? "EN" : "বাং"}
        </button>
    );
}
