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
import { useEffect, useState } from "react";
import VetHeader from "../components/VetHeader";
import FeatureCard from "../components/FeatureCard";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../context/LanguageContext";

function VetDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [vetName, setVetName] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
    const user_local = user || JSON.parse(localStorage.getItem("user"));
    if (user_local?.roles?.[0] !== "vet") {
      navigate("/");
    }
    setVetName(
      user_local?.name ||
      user_local?.full_name ||
      user_local?.username ||
      user_local?.email?.split("@")[0] ||
      ""
    );
  }, [isAuthenticated, navigate, user]);

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
        <section className="mx-auto max-w-2xl w-full px-4 mt-10">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 text-center w-full">
                {t("Welcome back")}{vetName ? `, Dr. ${vetName}` : ""}
              </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col items-center transition hover:shadow-2xl hover:-translate-y-1 duration-200">
                <img src="/icons/verifycred.webp" alt={t("Verify")} className="w-12 h-12 mb-4" />
                <h2 className="text-xl font-bold mb-2 text-center">{t("Verify Credentials")}</h2>
                <p className="text-sm text-slate-700 mb-6 text-center">
                  {t("Upload and verify your professional credentials to unlock advanced features.")}
                </p>
                <FeatureCard to="/verification">
                  <span className="font-semibold">{t("Verify Now")}</span>
                </FeatureCard>
              </div>
              <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col items-center transition hover:shadow-2xl hover:-translate-y-1 duration-200">
                <img src="/icons/pawDiagnostics.webp" alt={t("Diagnostics")} className="w-12 h-12 mb-4" />
                <h2 className="text-xl font-bold mb-2 text-center">{t("Check Diagnostics")}</h2>
                <p className="text-sm text-slate-700 mb-6 text-center">
                  {t("Access and review diagnostic results for your patients quickly and securely.")}
                </p>
                <FeatureCard to="/checkDiagnostics">
                  <span className="font-semibold">{t("View Diagnostics")}</span>
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