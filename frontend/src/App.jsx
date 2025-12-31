import { Routes, Route } from "react-router-dom";
import PetProfile from "./pages/PetProfile.jsx";
import AssistantChat from "./pages/AssistantChat.jsx";


import About from "./pages/About.jsx";
import Dashboard from "./pages/dashboard.jsx";
import VetFinder from "./pages/vetFinder.jsx";
import VaccineAlert from "./pages/vaccineAlert";
import PetCare from "./pages/petCare";
import PawPal from "./pages/PawPal";
import ProfilePage from "./pages/profilePage";
import AddPetPage from "./pages/AddPetPage";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignUp";
import SkinDiseaseDetector from "./pages/SkinDiseaseDetection";
import { TranslationProvider } from "react-autolocalise";
import LandingPage from "./pages/LandingPage";
import { PetProvider } from "./context/PetContext";
import VetDashboard from "./pages/VetDashboard";
import CheckDiagnostics from "./pages/CheckDIagnostics";
import VerifyVet from "./pages/VerifyVet";
import VetProfile from "./pages/VetProfile.jsx";



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
             <Routes>
               {/* <Route path="/" element={<Home />} /> */}
               <Route path="/" element={<LandingPage/>} />
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
             </Routes>
           </PetProvider>
         </AuthProvider>
       </TranslationProvider>
  );
}

export default App;

