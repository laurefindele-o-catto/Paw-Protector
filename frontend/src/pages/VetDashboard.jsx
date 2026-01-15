// import { useNavigate } from "react-router-dom";
// import { useAutoTranslate } from "react-autolocalise";
// import Footer from "../components/Footer";
// import { useAuth } from "../context/AuthContext";
// import { useEffect } from "react";
// import VetHeader from "../components/VetHeader";

// function VetDashboard() {

//   const navigate = useNavigate();
//   const { isAuthenticated } = useAuth();


//   useEffect(() => {
//     if (!isAuthenticated) {
//       navigate("/");
//     }
//     const user_local = JSON.parse(localStorage.getItem("user"));
//     if (user_local?.roles[0] !== "vet") {
//       navigate("/");
//     }
//   }, [isAuthenticated, navigate]);

//   return (
//     <>
//       {/* <Header /> */}
//       <VetHeader/>
//       <div className="relative min-h-screen flex flex-col bg-[#edfdfd] text-slate-900 overflow-hidden mt-28">
//         {/* animated background shapes */}
//         <div className="pointer-events-none fixed -top-32 -left-16 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
//         <div className="pointer-events-none fixed top-40 -right-10 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
//         <div className="pointer-events-none fixed bottom-10 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />
//         <div className="pointer-events-none fixed -bottom-24 right-20 h-72 w-72 border-18 border-[#fdd142]/20 rounded-full animate-[spin_20s_linear_infinite]" />

//         {/* diagonal dots accent */}
//         <div className="pointer-events-none absolute -top-6 right-8 h-32 w-32 opacity-30 animate-[slideDots_10s_linear_infinite]">
//           <div className="grid grid-cols-5 gap-3">
//             {Array.from({ length: 25 }).map((_, i) => (
//               <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0f172a]/40" />
//             ))}
//           </div>
//         </div>

//         {/* Main vet actions */}
//         <section className="mx-auto max-w-xl w-full px-4 mt-10">
//           <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg p-8 flex flex-col items-center gap-8">
//             <h1 className="text-2xl font-bold text-slate-800 mb-2">Vet Dashboard</h1>
//             <button
//               onClick={() => navigate("/verification")}
//               className="w-full py-4 px-6 bg-[#0f172a] text-[#edfdfd] rounded-xl font-semibold text-lg shadow hover:bg-[#22304a] transition"
//             >
//               Verify credentials
//             </button>
//             <button
//               onClick={() => navigate("/checkDiagnostics")}
//               className="w-full py-4 px-6 bg-[#fdd142] text-[#0f172a] rounded-xl font-semibold text-lg shadow hover:bg-[#ffe066] transition"
//             >
//               Check Diagnostics
//             </button>
//           </div>
//         </section>

//         {/* Bottom spacing */}
//         <br /><br /><br /><br />
//       </div>

//       <Footer />

//       {/* Keyframes */}
//       <style>{`
//         @keyframes slideup {
//           from { opacity: 0; transform: translateY(16px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes float {
//           0%, 100% { transform: translateY(0); }
//           50% { transform: translateY(-10px); }
//         }
//         @keyframes bouncey {
//           0%, 100% { transform: translateY(0) scale(1); }
//           50% { transform: translateY(-12px) scale(1.03); }
//         }
//         @keyframes spin {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }
//         @keyframes slideDots {
//           0% { transform: translateY(0) translateX(0); }
//           100% { transform: translateY(-30px) translateX(30px); }
//         }
//       `}</style>
//     </>
//   );
// }

// export default VetDashboard;


import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import VetHeader from "../components/VetHeader";
import FeatureCard from "../components/FeatureCard";
import { useLanguage } from "../context/LanguageContext";
import apiConfig from "../config/apiConfig";

function VetDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [vetName, setVetName] = useState("");
  const { t } = useLanguage();

  const token = useMemo(() => localStorage.getItem("token"), []);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
    const user_local = user || JSON.parse(localStorage.getItem("user"));
    if (user_local?.roles?.[0] !== "vet") {
      navigate("/");
    }

    const fullName = String(user_local?.full_name || user_local?.name || "").trim();
    const username = String(user_local?.username || "").trim();
    const emailPrefix = String(user_local?.email || "").split("@")[0]?.trim();
    setVetName(fullName || username || emailPrefix || "");
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    let alive = true;

    const run = async () => {
      setOverviewLoading(true);
      setOverviewError("");
      try {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.vetDashboard.overview}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || data?.message || "Failed to load vet overview");
        }
        if (!alive) return;
        setOverview(data);
      } catch (e) {
        if (!alive) return;
        setOverview(null);
        setOverviewError(e?.message || "Failed to load vet overview");
      } finally {
        if (alive) setOverviewLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, token]);

  return (
    <>
      <VetHeader />
      <div className="relative min-h-screen flex flex-col bg-[#edfdfd] text-slate-900 overflow-hidden mt-28">
        {/* animated background shapes */}
        <div className="pointer-events-none fixed -top-32 -left-16 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
        <div className="pointer-events-none fixed top-40 -right-10 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
        <div className="pointer-events-none fixed bottom-10 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />
        <div className="pointer-events-none fixed -bottom-24 right-20 h-72 w-72 border-18 border-[#fdd142]/20 rounded-full animate-[spin_20s_linear_infinite]" />

        {/* diagonal dots accent */}
        <div className="pointer-events-none absolute -top-6 right-8 h-32 w-32 opacity-30 animate-[slideDots_10s_linear_infinite]">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0f172a]/40" />
            ))}
          </div>
        </div>

        {/* Main vet actions */}
        <section className="mx-auto max-w-6xl w-full px-4 mt-10">
          <div className="flex flex-col gap-8">
            <div className="bg-white/85 backdrop-blur-md rounded-3xl shadow-lg p-5 md:p-6 border border-white">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                    {t("Welcome back")}{vetName ? `, Dr. ${vetName}` : ""}
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    {t("Quick overview of your diagnostics and consults")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (overviewLoading) return;
                    // lightweight refresh
                    setOverview(null);
                    setOverviewError("");
                    // trigger effect by toggling token-read not possible; fetch inline
                    (async () => {
                      if (!token) return;
                      setOverviewLoading(true);
                      try {
                        const res = await fetch(`${apiConfig.baseURL}${apiConfig.vetDashboard.overview}`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(data?.error || data?.message || "Failed to load vet overview");
                        setOverview(data);
                      } catch (e) {
                        setOverviewError(e?.message || "Failed to load vet overview");
                      } finally {
                        setOverviewLoading(false);
                      }
                    })();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0f172a] text-[#edfdfd] text-sm font-semibold hover:bg-slate-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={overviewLoading}
                >
                  {overviewLoading ? t("Refreshing...") : t("Refresh")}
                </button>
              </div>

              {overviewError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                  {t("Error")}: {overviewError}
                </div>
              )}

              <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-white p-3 border border-slate-100">
                  <div className="text-xs text-slate-500">{t("Approved")}</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    {overview?.mlDiagnostics?.approvedCount ?? 0}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3 border border-slate-100">
                  <div className="text-xs text-slate-500">{t("Declined")}</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    {overview?.mlDiagnostics?.declinedCount ?? 0}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3 border border-slate-100">
                  <div className="text-xs text-slate-500">{t("Health Checks Pending")}</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    {overview?.petHealthChecks?.pendingCount ?? 0}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3 border border-slate-100">
                  <div className="text-xs text-slate-500">{t("Health Checks Responded")}</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    {overview?.petHealthChecks?.respondedCount ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <details className="rounded-2xl bg-white border border-slate-100 p-4">
                  <summary className="cursor-pointer font-semibold text-slate-800">
                    {t("Pet Health Checks Summary")}
                  </summary>
                  <div className="mt-3 overflow-x-auto">
                    {(overview?.petHealthChecks?.petsCheckedSummary || []).length === 0 ? (
                      <div className="text-sm text-slate-600">{t("No responded health checks yet.")}</div>
                    ) : (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-600">
                            <th className="py-2 pr-4">{t("Pet")}</th>
                            <th className="py-2 pr-4">{t("Total")}</th>
                            <th className="py-2 pr-4">{t("Last Activity")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.petHealthChecks.petsCheckedSummary.map((row) => (
                            <tr key={String(row.pet_id)} className="border-t">
                              <td className="py-2 pr-4 font-medium text-slate-900">
                                {row.pet_name || `#${row.pet_id}`}
                              </td>
                              <td className="py-2 pr-4">{row.total_checks}</td>
                              <td className="py-2 pr-4">
                                {row.last_activity_at ? new Date(row.last_activity_at).toLocaleString() : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </details>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/90 rounded-3xl shadow-lg p-5 flex flex-col items-center transition hover:shadow-2xl hover:-translate-y-1 duration-200">
                <img src="/icons/verifycred.webp" alt={t("Verify")} className="w-14 h-14 mb-4" />
                <h2 className="text-xl font-bold mb-2 text-center">{t("Verify Credentials")}</h2>
                <p className="text-sm text-slate-700 mb-6 text-center">
                  {t("Upload and verify your professional credentials to unlock advanced features.")}
                </p>
                <FeatureCard to="/verification">
                  <span className="font-semibold">{t("Verify Now")}</span>
                </FeatureCard>
              </div>
              <div className="bg-white/90 rounded-3xl shadow-lg p-5 flex flex-col items-center transition hover:shadow-2xl hover:-translate-y-1 duration-200">
                <img src="/icons/pawDiagnostics.webp" alt={t("Diagnostics")} className="w-14 h-14 mb-4" />
                <h2 className="text-xl font-bold mb-2 text-center">{t("Check Diagnostics")}</h2>
                <p className="text-sm text-slate-700 mb-6 text-center">
                  {t("Access and review diagnostic results for your patients quickly and securely.")}
                </p>
                <FeatureCard to="/checkDiagnostics">
                  <span className="font-semibold">{t("View Diagnostics")}</span>
                </FeatureCard>
              </div>

              <div className="bg-white/90 rounded-3xl shadow-lg p-5 flex flex-col items-center transition hover:shadow-2xl hover:-translate-y-1 duration-200">
                <img src="/icons/call-icon.png" alt={t("Health Checks")} className="w-14 h-14 mb-4" />
                <h2 className="text-xl font-bold mb-2 text-center">{t("Health Check Inbox")}</h2>
                <p className="text-sm text-slate-700 mb-6 text-center">
                  {t("Respond to pet health check consult requests.")}
                </p>
                <FeatureCard to="/vetHealthChecks">
                  <span className="font-semibold">{t("Open Inbox")}</span>
                </FeatureCard>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom spacing */}
        <br /><br /><br /><br />
      </div>

      <Footer />

      {/* Keyframes */}
      <style>{`
        @keyframes slideup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bouncey {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideDots {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-30px) translateX(30px); }
        }
      `}</style>
    </>
  );
}

export default VetDashboard;