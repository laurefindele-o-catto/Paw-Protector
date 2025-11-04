import { Routes, Route } from "react-router-dom";
import PetProfile from "./pages/PetProfile";

import Home from "./Pages/Home";
import About from "./Pages/About";
import Dashboard from "./pages/dashboard";
import VetFinder from "./pages/VetFinder";
import VaccineAlert from "./Pages/vaccineAlert";
import PetCare from "./Pages/PetCare";
import PawPal from "./Pages/PawPal";
import ProfilePage from "./pages/profilePage";
import AddPetPage from "./Pages/AddPetPage";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignUp";
import SkinDiseaseDetector from "./Pages/SkinDiseaseDetection";
import { TranslationProvider } from "react-autolocalise";
import LandingPage from "./Pages/LandingPage";
import { PetProvider } from "./context/PetContext";



function App() {
  const config = {
    apiKey: "at_client_6sJVCGCBLTia",
    sourceLocale: "en", // Your app's original language
    targetLocale: "bn", // Language to translate to
  }
  return (
    <>
      <TranslationProvider config={config}>
        <AuthProvider>
          <PetProvider>
            <Routes>
              {/* <Route path="/" element={<Home />} /> */}
              <Route path="/" element={<LandingPage/>} />
              <Route path="/skinDiseaseDetection" element={<SkinDiseaseDetector/>} />
              <Route path="/about" element={<About />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/find-a-vet" element={<VetFinder />} />
              <Route path="/vaccination-alerts" element={<VaccineAlert />} />
              <Route path="/petcare" element={<PetCare />} />
              <Route path="/paw-pal" element={<PawPal />} />
              <Route path="/profile" element={< ProfilePage/>} />
              <Route path="/addPet" element={< AddPetPage/>} />
              <Route path="/login" element = {<LoginPage/>}/>
              <Route path="/signup" element={<SignupPage/>}/>
              <Route path="/pet-profile" element={<PetProfile />} />
              
            </Routes>
          </PetProvider>
        </AuthProvider>
      </TranslationProvider>
    </>
  );
}

export default App;

