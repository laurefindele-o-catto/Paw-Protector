import React from "react";
import Sidebar from "./Sidebar";

export default function PetProfileLayout({
  sidebarOpen, setSidebarOpen, tab, setTab,
  pets, currentPetId, selectPet, children
}) {
  return (
    <div className="flex gap-4">
      {sidebarOpen && (
        <aside className="w-56 shrink-0 bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-3 h-fit">
          <div className="text-xs uppercase text-slate-500 mb-2">Manage</div>
          <Sidebar tab={tab} setTab={setTab} />
        </aside>
      )}
      <main className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm"
            >
              {sidebarOpen ? "Hide menu" : "Show menu"}
            </button>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600">Pet</label>
              <select
                value={currentPetId || ""}
                onChange={(e) => selectPet(parseInt(e.target.value, 10))}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              >
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}