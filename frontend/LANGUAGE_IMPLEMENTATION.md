# Language Accessibility - Implementation Guide

## Overview
The application now has a **centralized language accessibility system** that allows users to toggle between **English** and **Bangla** (Bengali) languages. When a user toggles the language in one place, it automatically reflects across the entire application.

## Architecture

### 1. LanguageContext (`src/context/LanguageContext.jsx`)
The central context provider that manages the language state globally:

```jsx
import { useLanguage } from '../context/LanguageContext';

const { t, useTranslation, toggleLanguage, currentLanguage } = useLanguage();
```

**Features:**
- Persists language preference in `localStorage`
- Provides translation function `t()` that respects the toggle state
- Offers `toggleLanguage()` method to switch languages
- Exposes `useTranslation` boolean (true = Bangla, false = English)
- Provides `currentLanguage` helper ('bn' or 'en')

### 2. App Provider Hierarchy (`src/App.jsx`)
```jsx
<TranslationProvider config={config}>
  <AuthProvider>
    <PetProvider>
      <LanguageProvider>
        {/* Your routes */}
      </LanguageProvider>
    </PetProvider>
  </AuthProvider>
</TranslationProvider>
```

The `LanguageProvider` wraps all routes, making the language state accessible everywhere.

## How to Use

### In Components/Pages

**Before (Old Pattern - DON'T USE):**
```jsx
import { useAutoTranslate } from "react-autolocalise";

function MyComponent() {
  const { t: translate } = useAutoTranslate();
  const [useTranslation, setUseTranslation] = useState(true);
  const t = useTranslation && translate ? translate : (s) => s;
  
  const handleTranslationToggle = (newState) => {
    setUseTranslation(newState);
  };
  
  return <div>{t('Hello')}</div>;
}
```

**After (New Pattern - USE THIS):**
```jsx
import { useLanguage } from "../context/LanguageContext";

function MyComponent() {
  const { t } = useLanguage();
  
  return <div>{t('Hello')}</div>;
}
```

### Language Toggle Button

You can add the language toggle anywhere using the standalone component:

```jsx
import LanguageToggle from '../components/LanguageToggle';

function MyPage() {
  return (
    <div>
      <LanguageToggle />
      {/* or with custom className */}
      <LanguageToggle className="my-custom-class" />
    </div>
  );
}
```

Or use the hook directly:

```jsx
import { useLanguage } from '../context/LanguageContext';

function MyCustomToggle() {
  const { useTranslation, toggleLanguage, currentLanguage } = useLanguage();
  
  return (
    <button onClick={toggleLanguage}>
      Current: {currentLanguage}
    </button>
  );
}
```

## Updated Components

### Headers
- ✅ `Header.jsx` - Now includes language toggle and uses centralized context
- ✅ `VetHeader.jsx` - Now includes language toggle and uses centralized context

### Pages
- ✅ `dashboard.jsx`
- ✅ `AssistantChat.jsx`
- ✅ `CheckDiagnostics.jsx`
- ✅ `PetProfile.jsx`
- ✅ `vaccineAlert.jsx`
- ✅ `petCare.jsx`
- ✅ `PawPal.jsx`
- ✅ `SkinDiseaseDetection.jsx`
- ✅ `profilePage.jsx`

All pages have been updated to:
1. Import `useLanguage` instead of `useAutoTranslate`
2. Remove local translation state
3. Use centralized `t()` function
4. Remove `translationState` and `onTranslationToggle` props from Header

## Key Benefits

1. **Single Source of Truth**: Language preference is managed in one place
2. **Persistent State**: User preference is saved in localStorage
3. **Automatic Sync**: Toggle in one page reflects everywhere instantly
4. **Simplified Code**: No need for local state management in each component
5. **Easy to Use**: Import one hook and get translation function
6. **Reusable Toggle**: Use the `LanguageToggle` component anywhere

## Testing

To test the language toggle:

1. Go to any page (e.g., Dashboard)
2. Click the language toggle button (shows "EN" or "বাং")
3. Navigate to another page
4. The language preference should be maintained
5. Refresh the page - preference should still be saved

## Migration Checklist for New Pages

When creating a new page that needs translation:

- [ ] Import `useLanguage` from `'../context/LanguageContext'`
- [ ] Use `const { t } = useLanguage();` instead of `useAutoTranslate`
- [ ] Remove any local `useTranslation` state
- [ ] Remove any `handleTranslationToggle` functions
- [ ] Don't pass `translationState` or `onTranslationToggle` to Header
- [ ] Use `t('Your text')` for translations

## Troubleshooting

**Issue**: Translations not working
- **Solution**: Ensure `LanguageProvider` wraps your component in App.jsx

**Issue**: Toggle not reflecting across pages
- **Solution**: Check that you're using `useLanguage()` hook, not `useAutoTranslate()`

**Issue**: State not persisting after refresh
- **Solution**: Check browser localStorage - key should be `'useTranslation'`

## Future Enhancements

- Add more languages (Spanish, Hindi, etc.)
- Add language selector dropdown instead of just toggle
- Add RTL support for languages that require it
- Add language-specific date/number formatting
