import { Routes, Route } from "react-router-dom";
import PetProfile from "./pages/PetProfile";


import About from "./Pages/About";
import Dashboard from "./Pages/dashboard";
import VetFinder from "./Pages/VetFinder";
import VaccineAlert from "./Pages/vaccineAlert";
import PetCare from "./Pages/petCare";
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
import VetDashboard from "./Pages/VetDashboard";
import CheckDiagnostics from "./Pages/CheckDIagnostics";
import VerifyVet from "./Pages/VerifyVet";



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
              <Route path="/check" element={<CheckDiagnostics/>} />
              <Route path="/vdashboard" element={<VetDashboard/>} />
              <Route path="/verification" element={<VerifyVet/>} />
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

