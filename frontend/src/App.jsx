import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import ProfilePage from "./Pages/profilePage";
import AddPetPage from "./Pages/AddPetPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/profile" element={< ProfilePage/>} />
      <Route path="/addPet" element={< AddPetPage/>} />
    </Routes>
  );
}

export default App;

