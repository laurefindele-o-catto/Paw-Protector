// src/components/FeaturesSection.jsx
import FeatureCard from "./FeatureCard";

export default function FeaturesSection() {
  return (
    <nav
      className="
        w-full
        flex
        justify-center
        items-center
        gap-2
        py-2
        px-2
        border-b-0
        bg-transparent
        sticky top-14 z-20
        overflow-x-auto
        hide-scrollbar
        shadow-none
      "
      style={{ minHeight: "56px" }}
    >
      <FeatureCard to="/paw-pal">🐾 PawPal</FeatureCard>
      <FeatureCard to="/skinDiseaseDetection">Disease Detection</FeatureCard>
      <FeatureCard to="/petcare">Pet Care</FeatureCard>
      <FeatureCard to="/find-a-vet">Find a Vet</FeatureCard>
      <FeatureCard to="/vaccination-alerts">Vaccination Alerts</FeatureCard>
    </nav>
  );
}
