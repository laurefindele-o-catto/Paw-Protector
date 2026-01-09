// Example: How to use the centralized Language Context in your pages

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import LanguageToggle from '../components/LanguageToggle';

export default function ExamplePage() {
  // Get the translation function from the centralized context
  const { t, useTranslation, toggleLanguage, currentLanguage } = useLanguage();

  return (
    <>
      {/* Header already has the language toggle built-in */}
      <Header />
      
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-4">
          {t('Example Page')}
        </h1>
        
        <p className="mb-4">
          {t('Current language')}: {currentLanguage}
        </p>
        
        <p className="mb-4">
          {t('Translation is')} {useTranslation ? t('enabled') : t('disabled')}
        </p>

        {/* Example 1: Use the standalone LanguageToggle component */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t('Option 1: Standalone Toggle Component')}
          </h2>
          <LanguageToggle />
        </div>

        {/* Example 2: Custom toggle button */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t('Option 2: Custom Toggle Button')}
          </h2>
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('Switch to')} {useTranslation ? 'English' : 'বাংলা'}
          </button>
        </div>

        {/* Example 3: Translating multiple texts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t('Example Translations')}
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('Welcome to PawPal')}</li>
            <li>{t('Your pet care companion')}</li>
            <li>{t('Dashboard')}</li>
            <li>{t('Pet Profile')}</li>
            <li>{t('Find a Vet')}</li>
          </ul>
        </div>

        {/* Example 4: Conditional rendering based on language */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t('Conditional Content')}
          </h2>
          {useTranslation ? (
            <p className="text-green-600">বাংলায় বিষয়বস্তু দেখানো হচ্ছে</p>
          ) : (
            <p className="text-blue-600">Showing content in English</p>
          )}
        </div>

        {/* Pro Tips */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <h3 className="font-bold mb-2">{t('Pro Tips')}:</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>{t('The language preference is saved in localStorage')}</li>
            <li>{t('It persists across page refreshes')}</li>
            <li>{t('Toggle in one place, changes everywhere')}</li>
            <li>{t('No need to pass props between components')}</li>
          </ul>
        </div>
      </div>
    </>
  );
}

// ============================================
// Quick Reference:
// ============================================
// 
// useLanguage() returns:
// {
//   t: (text) => translatedText,          // Translation function
//   useTranslation: boolean,               // true = Bangla, false = English
//   toggleLanguage: () => void,            // Function to toggle language
//   setUseTranslation: (bool) => void,     // Function to set specific language
//   currentLanguage: 'bn' | 'en'           // Current language code
// }
