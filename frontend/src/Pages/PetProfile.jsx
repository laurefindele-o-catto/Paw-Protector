import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { usePet } from "../context/PetContext";
import PetProfileLayout from "../features/petProfile/PetProfileLayout";
import OverviewTab from "../features/petProfile/tabs/OverviewTab";
import BasicInfoTab from "../features/petProfile/tabs/BasicInfoTab";
import HealthMetricsTab from "../features/petProfile/tabs/HealthMetricsTab";
import DiseasesTab from "../features/petProfile/tabs/DiseasesTab";
import VaccinationsTab from "../features/petProfile/tabs/VaccinationsTab";
import DewormingTab from "../features/petProfile/tabs/DewormingTab";

export default function PetProfile() {
  const { pets, currentPet, currentPetId, selectPet, currentPetSummary, refreshSummary } = usePet();

  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [tab, setTab] = React.useState("overview");

  return (
    <>
      <Header />
      <div className="pt-12 my-24 min-h-screen bg-[#edfdfd]">
        <div className="max-w-7xl mx-auto p-4">
          <PetProfileLayout
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            tab={tab}
            setTab={setTab}
            pets={pets}
            currentPetId={currentPetId}
            selectPet={selectPet}
          >
            {!currentPet ? (
              <div className="p-6 bg-white/80 border border-white rounded-2xl shadow">No pet selected.</div>
            ) : (
              <>
                {tab === "overview" && (
                  <OverviewTab pet={currentPet} summary={currentPetSummary} />
                )}
                {tab === "basic" && (
                  <BasicInfoTab pet={currentPet} onSaved={refreshSummary} />
                )}
                {tab === "health" && (
                  <HealthMetricsTab pet={currentPet} summary={currentPetSummary} onSaved={refreshSummary} />
                )}
                {tab === "diseases" && (
                  <DiseasesTab pet={currentPet} summary={currentPetSummary} onChanged={refreshSummary} />
                )}
                {tab === "vaccinations" && (
                  <VaccinationsTab pet={currentPet} summary={currentPetSummary} onChanged={refreshSummary} />
                )}
                {tab === "deworming" && (
                  <DewormingTab pet={currentPet} summary={currentPetSummary} onChanged={refreshSummary} />
                )}
              </>
            )}
          </PetProfileLayout>
        </div>
      </div>
      <Footer />
    </>
  );
}