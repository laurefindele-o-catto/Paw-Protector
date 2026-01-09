import { createContext, useContext, useState, useEffect } from "react";
import { useAutoTranslate } from "react-autolocalise";

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export const LanguageProvider = ({ children }) => {
    // Initialize from localStorage or default to true (Bangla translation enabled)
    const [useTranslation, setUseTranslation] = useState(() => {
        const saved = localStorage.getItem('useTranslation');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const { t: translate } = useAutoTranslate();

    // Persist to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('useTranslation', JSON.stringify(useTranslation));
    }, [useTranslation]);

    // Translation function that respects the toggle state
    const t = useTranslation && translate ? translate : (s) => s;

    const toggleLanguage = () => {
        setUseTranslation(prev => !prev);
    };

    const value = {
        useTranslation,
        setUseTranslation,
        toggleLanguage,
        t, // Wrapped translation function
        currentLanguage: useTranslation ? 'bn' : 'en' // Helper to know current language
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
