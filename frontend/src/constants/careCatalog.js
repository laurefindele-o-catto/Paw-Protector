// Shared care constants used across Pet Care + Vaccination Alerts

export const VACCINE_CORE_BY_SPECIES = {
  cat: ["Rabies", "FVRCP", "FeLV"],
  dog: ["Rabies", "DHPP"],
};

export const VACCINE_ALL_OPTIONS_BY_SPECIES = {
  cat: ["Rabies", "FVRCP", "FeLV", "Other"],
  dog: ["Rabies", "DHPP", "Other"],
};

export function normalizeSpecies(raw) {
  const s = String(raw || "").toLowerCase();
  if (!s) return null;
  if (s.includes("cat") || s.includes("feline")) return "cat";
  if (s.includes("dog") || s.includes("canine")) return "dog";
  return null;
}

export function normalizeVaccineName(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return null;

  // Common canonical mapping
  if (s.includes("rab")) return "Rabies";
  if (s === "fvrcp" || s.includes("fvrcp")) return "FVRCP";
  if (s === "felv" || s.includes("felv") || s.includes("fe-lv")) return "FeLV";

  // Dog core vaccine often entered as DHPP / DAPP / distemper combo
  if (s === "dhpp" || s === "dapp" || s.includes("dhpp") || s.includes("dapp")) return "DHPP";
  if (s.includes("distemper")) return "DHPP";

  // fall back to original casing-ish if user typed something custom
  return raw;
}
