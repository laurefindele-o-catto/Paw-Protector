import React from "react";

const TabButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
      active ? "bg-[#0f172a] text-[#edfdfd]" : "bg-white border border-slate-200 hover:bg-slate-50"
    }`}
  >
    {children}
  </button>
);

export default function Sidebar({ tab, setTab }) {
  return (
    <div className="space-y-2">
      <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>Overview</TabButton>
      <TabButton active={tab === "basic"} onClick={() => setTab("basic")}>Basic info</TabButton>
      <TabButton active={tab === "health"} onClick={() => setTab("health")}>Health metrics</TabButton>
      <TabButton active={tab === "diseases"} onClick={() => setTab("diseases")}>Diseases</TabButton>
      <TabButton active={tab === "vaccinations"} onClick={() => setTab("vaccinations")}>Vaccinations</TabButton>
      <TabButton active={tab === "deworming"} onClick={() => setTab("deworming")}>Deworming</TabButton>
    </div>
  );
}