import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import apiConfig from "../config/apiConfig";
import { useAuth } from "./AuthContext";

const PetContext = createContext(null);

export const usePet = () => {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error("usePet must be used within PetProvider");
  return ctx;
};

export const PetProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [pets, setPets] = useState([]);
  const [currentPetId, setCurrentPetId] = useState(() => {
    const raw = localStorage.getItem("current_pet_id");
    return raw ? parseInt(raw, 10) : null;
  });
  const [currentPet, setCurrentPet] = useState(() => {
    try { return JSON.parse(localStorage.getItem("current_pet") || "null"); } catch { return null; }
  });
  const [currentPetSummary, setCurrentPetSummary] = useState(() => {
    try { return JSON.parse(localStorage.getItem("current_pet_summary") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const pickDefault = useCallback((list) => {
    if (!list || list.length === 0) {
      setCurrentPetId(null);
      setCurrentPet(null);
      setCurrentPetSummary(null);
      localStorage.removeItem("current_pet_id");
      localStorage.removeItem("current_pet");
      localStorage.removeItem("current_pet_summary");
      return;
    }
    if (!currentPetId || !list.some(p => p.id === currentPetId)) {
      const first = list[0];
      setCurrentPetId(first.id);
      setCurrentPet(first);
      localStorage.setItem("current_pet_id", String(first.id));
      localStorage.setItem("current_pet", JSON.stringify(first));
    } else {
      const match = list.find(p => p.id === currentPetId);
      if (match) {
        setCurrentPet(match);
        localStorage.setItem("current_pet", JSON.stringify(match));
      }
    }
  }, [currentPetId]);

  const loadSummary = useCallback(async (id) => {
    if (!id || !token) return;
    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.pets.summary(id)}`, { headers: authHeader });
      if (!res.ok) throw new Error("summary fetch failed");
      const json = await res.json();
      const summary = json?.summary || null;
      setCurrentPetSummary(summary);
      if (summary) localStorage.setItem("current_pet_summary", JSON.stringify(summary));
      else localStorage.removeItem("current_pet_summary");
    } catch {
      setCurrentPetSummary(null);
      localStorage.removeItem("current_pet_summary");
    }
  }, [token, authHeader]);

  const reload = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiConfig.baseURL}/api/pets`, { headers: authHeader });
      const json = await res.json();
      const list = json?.pets || [];
      setPets(list);
      pickDefault(list);
    } catch {
      setPets([]);
      pickDefault([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, authHeader, pickDefault]);

  useEffect(() => { reload(); }, [reload]);

  // load summary whenever selection changes
  useEffect(() => {
    if (currentPetId) loadSummary(currentPetId);
  }, [currentPetId, loadSummary]);

  const selectPet = useCallback((id) => {
    setCurrentPetId(id);
    localStorage.setItem("current_pet_id", String(id));
    const found = pets.find(p => p.id === id) || null;
    setCurrentPet(found);
    if (found) localStorage.setItem("current_pet", JSON.stringify(found));
    loadSummary(id);
  }, [pets, loadSummary]);

  const value = useMemo(() => ({
    loading,
    pets,
    currentPetId,
    currentPet,
    currentPetSummary,
    selectPet,
    reload,
    refreshSummary: () => currentPetId && loadSummary(currentPetId)
  }), [loading, pets, currentPetId, currentPet, currentPetSummary, selectPet, reload, loadSummary]);

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
};

export default PetContext;