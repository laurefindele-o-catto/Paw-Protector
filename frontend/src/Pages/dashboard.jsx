// dashboard.jsx
import { Link, useNavigate } from "react-router-dom";
import ProfilePictureCard from "../Components/profilePictureCard";
// import catGif from "../assets/giphy/cat.gif"; // if you keep it in src
import FeaturesSection from "../Components/FeaturesSection";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import apiConfig from "../config/apiConfig";
import { useAutoTranslate } from "react-autolocalise";
import useLoader from "../hooks/useLoader";
const placeholder = "/placeholder.png";



function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, loading, error } = useAutoTranslate();

  const [user, setUser] = useState(null);
  const [isLoading, setLoading] = useLoader();
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Add this

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }

    const user_local = JSON.parse(localStorage.getItem("user"));
    setUser(user_local);
  }, [isAuthenticated, navigate]);
  
  const { logout } = useAuth();
  const handleLogout = async () => {
    setIsLoggingOut(true); // Change to use local state
    await logout();
    setIsLoggingOut(false); // Change to use local state
    navigate("/");
  }

  // console.log(user);

  return (
    <div
      className="relative min-h-screen flex flex-col bg-[#edfdfd] text-slate-900 overflow-hidden"
    >
      {/* animated background shapes (LandingPage palette) */}
      <div className="pointer-events-none fixed -top-32 -left-16 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed top-40 -right-10 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
      <div className="pointer-events-none fixed bottom-10 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed -bottom-24 right-20 h-72 w-72 border-[18px] border-[#fdd142]/20 rounded-full animate-[spin_20s_linear_infinite]" />

      {/* diagonal dots accent */}
      <div className="pointer-events-none absolute -top-6 right-8 h-32 w-32 opacity-30 animate-[slideDots_10s_linear_infinite]">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0f172a]/40" />
          ))}
        </div>
      </div>

      {/* Top Bar */}
      <header className="z-10 relative">
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="flex items-center bg-white/70 backdrop-blur-md border border-white rounded-2xl shadow p-3 md:p-4 animate-[slideup_0.6s_ease-out] relative">
            {/* Profile picture on the left */}
            <Link to="/profile" aria-label={t("Profile")} className="shrink-0 mr-4">
              <ProfilePictureCard
                avatarUrl={user?.avatar_url ? user.avatar_url : placeholder}
                name={user?.username}
              />
            </Link>
            {/* Centered logo and text */}
            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#edfdfd] font-bold text-xs select-none">
                  PP
                </div>
                <div className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
                  {t("🐾 PawPal")}
                </div>
              </div>
            </div>
            {/* Button on the right */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut} // Change here
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center px-4 py-2 bg-red-700 text-[#ffffff] rounded-lg shadow hover:bg-gray-700 transition z-20 disabled:opacity-60"
              aria-label="Back to profile"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {isLoggingOut ? "Logging out..." : "Logout"} // Change here
            </button>
          </div>
        </div>
      </header>

      {/* Random Cat Fact */}
      <section className="mx-auto max-w-6xl w-full px-4 mt-6">
        <div className="text-center bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-6">
          <h2 className="text-lg md:text-xl italic text-slate-700">
            {t("Cats sleep for 70% of their lives.")}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t("This text will be automatically translated")}
          </p>
        </div>
      </section>

      {/* Scrollable Row */}
      <section className="mx-auto max-w-6xl w-full px-2 sm:px-4 mt-6">
        <div className="bg-white/70 backdrop-blur-md border border-white rounded-3xl shadow p-2 sm:p-4">
          <FeaturesSection />
        </div>
      </section>

      {/* Bottom Bar */}
      <footer className="mx-auto max-w-6xl w-full px-4 mt-8 mb-20">
        {/* Top row: cat gif + about */}
        <div className="flex items-center justify-between gap-4 bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow p-4">
          {/* Cat gif center on small screens */}
          <div className="flex justify-center w-full">
            <img
              src="/giphy/cat playing a recorder.gif" // put your gif in public/ folder
              alt={t("Cat playing a recorder")}
              className="h-16 w-auto"
            />
          </div>

          {/* Info button */}
          <a
            href="/about"
            className="bg-[#0f172a] text-[#edfdfd] w-10 h-10 flex items-center justify-center rounded-full shadow-lg hover:bg-slate-900 transition transform hover:scale-110"
            title={t("About")}
          >
            {t("i")}
          </a>
        </div>

        {/* Bottom text */}
        <p className="mt-3 text-sm text-slate-600 text-center">
          {t("Leave a review at")}{" "}
          <a href="pawmeowmanool@gmail.com" className="text-slate-900 underline decoration-[#fdd142] decoration-2 underline-offset-2">
            pawmeowmanool@gmail.com
          </a>
        </p>
      </footer>

      {/* Floating Call Button */}
      <a
        href="tel:+8801888548012"
        className="fixed bottom-8 left-8 bg-red-500 w-16 h-16 flex flex-col items-center justify-center rounded-full shadow-lg hover:bg-red-600 transition transform hover:scale-110 text-center"
        aria-label={t("Call emergency contact")}
      >
        <img src="/icons/call-icon.png" alt={t("Call icon")} className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-semibold text-white leading-none">
          {t("Emergency")}
        </span>
      </a>

      {/* keyframes (mirrors LandingPage) */}
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
    </div>
  );
}

export default Dashboard;

