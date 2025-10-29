import { Routes, Route } from "react-router-dom";

import Home from "./Pages/Home";
import About from "./Pages/About";
import Dashboard from "./Pages/dashboard";
import DiseaseDetection from "./Pages/DiseaseDetection";
import VetFinder from "./Pages/VetFinder";
import VaccineAlert from "./Pages/VaccineAlert";
import PetCare from "./Pages/PetCare";
import PawPal from "./Pages/PawPal";
import ProfilePage from "./Pages/profilePage";
import AddPetPage from "./Pages/AddPetPage";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/disease-detection" element={<DiseaseDetection />} />
      <Route path="/find-a-vet" element={<VetFinder />} />
      <Route path="/vaccination-alerts" element={<VaccineAlert />} />
      <Route path="/petcare" element={<PetCare />} />
      <Route path="/paw-pal" element={<PawPal />} />
      <Route path="/profile" element={< ProfilePage/>} />
      <Route path="/addPet" element={< AddPetPage/>} />
    </Routes>
  );
}

export default App;

