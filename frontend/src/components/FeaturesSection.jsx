// src/components/FeaturesSection.jsx
import FeatureCard from "./FeatureCard";
import { useLanguage } from "../context/LanguageContext";

export default function FeaturesSection() {
  const { t } = useLanguage();
  return (
    <nav
      className="
        w-full
        flex
        justify-center
        items-center
        gap-2
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
      <FeatureCard to="/guide">{t("Guide")}</FeatureCard>
      <FeatureCard to="/skinDiseaseDetection">{t("Disease Detection")}</FeatureCard>
      <FeatureCard to="/petcare">{t("Pet Care")}</FeatureCard>
      <FeatureCard to="/find-a-vet">{t("Find a Vet")}</FeatureCard>
      <FeatureCard to="/vaccination-alerts">{t("Vaccination Alerts")}</FeatureCard>
    </nav>
  );
}
