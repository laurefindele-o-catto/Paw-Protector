import { Routes, Route, useLocation } from "react-router-dom";
import PetProfile from "./pages/PetProfile.jsx";
import AssistantChat from "./pages/AssistantChat.jsx";


import About from "./pages/About.jsx";
import Dashboard from "./pages/dashboard.jsx";
import VetFinder from "./pages/vetFinder.jsx";
import VaccineAlert from "./pages/vaccineAlert.jsx";
import PetCare from "./pages/petCare.jsx";
import PawPal from "./pages/PawPal.jsx";
import ProfilePage from "./pages/profilePage.jsx";
import AddPetPage from "./pages/AddPetPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignUp.jsx";
import SkinDiseaseDetector from "./pages/SkinDiseaseDetection.jsx";
import { TranslationProvider } from "react-autolocalise";
import LandingPage from "./pages/LandingPage.jsx";
import { PetProvider } from "./context/PetContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import VetDashboard from "./pages/VetDashboard.jsx";
import CheckDiagnostics from "./pages/CheckDIagnostics.jsx";
import VerifyVet from "./pages/VerifyVet.jsx";
import VetProfile from "./pages/VetProfile.jsx";
import VoiceControl from "./components/VoiceControl.jsx";
import SkipToContent from "./components/SkipToContent.jsx";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.jsx";
import OfflineIndicator from "./components/OfflineIndicator.jsx";
import Offline from "./pages/Offline.jsx";

function AppContent() {
  const location = useLocation();
  
  // Show VoiceControl on all pages except landing and auth pages
  const showVoiceControl = !["/", "/login", "/signup"].includes(location.pathname);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onVoiceToggle: () => {
      const voiceButton = document.querySelector('[aria-label="Toggle voice control"]');
      if (voiceButton) voiceButton.click();
    },
  });

  return (
    <>
      {/* Offline connection indicator */}
      <OfflineIndicator />
      
      {/* Skip to content link for keyboard navigation */}
      <SkipToContent />
      
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/" element={<LandingPage/>} />
        <Route path="/offline" element={<Offline/>} />
        <Route path="/skinDiseaseDetection" element={<SkinDiseaseDetector/>} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vdashboard" element={<VetDashboard />} />
        <Route path="/find-a-vet" element={<VetFinder />} />
        <Route path="/vaccination-alerts" element={<VaccineAlert />} />
        <Route path="/petcare" element={<PetCare />} />
        <Route path="/paw-pal" element={<PawPal />} />
        <Route path="/profile" element={< ProfilePage/>} />
        <Route path="/vetprofile" element={< VetProfile/>} />
        <Route path="/addPet" element={< AddPetPage/>} />
        <Route path="/login" element = {<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
        <Route path="/pet-profile" element={<PetProfile />} />
        <Route path="/assistant" element={<AssistantChat />} />
        <Route path="/CheckDiagnostics" element={<CheckDiagnostics />} />
      </Routes>
      
      {/* Global Voice Control - shows on authenticated pages */}
      {showVoiceControl && <VoiceControl />}
    </>
  );
}

function App() {
  const config = {
    apiKey: import.meta.env.VITE_AUTO_LOCALISE_KEY,
    sourceLocale: "en", // Your app's original language
    targetLocale: "bn", // Language to translate to
  }
  return (
       <TranslationProvider config={config}>
         <AuthProvider>
           <PetProvider>
             <LanguageProvider>
               <AppContent />
             </LanguageProvider>
           </PetProvider>
         </AuthProvider>
       </TranslationProvider>
  );
}

export default App;

