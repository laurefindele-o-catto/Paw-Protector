// LoginPage.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useLoader } from '../hooks/useLoader';
import { Loader } from '../components/Loader';
import { useLanguage } from '../context/LanguageContext';

//Ui
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Wrap login with loader hook
  const { run: loginWithLoader, loading } = useLoader(async (id, pass) => {
    const { success, error: errMsg } = await login(id, pass);
    if (success){
      const user = JSON.parse(localStorage.getItem("user"));
      if(user.roles[0] == "owner"){
        navigate("/dashboard");
      }
      else if(user.roles[0]=='vet'){
        navigate("/vdashboard");
      }
    }
    else setError(errMsg || "Login Failed");
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginWithLoader(identifier, password);
  };

  return (
    <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden flex items-center justify-center px-6">
      {/* animated background shapes (palette from LandingPage) */}
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

      {/* card */}
      <div className="relative w-full max-w-md bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 md:p-8 animate-[slideup_0.6s_ease-out]">
        {/* brand chip */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl overflow-hidden animate-[popin_0.5s_ease]">
            <img src="/logo.png" alt="PawPal logo" className="h-full w-full object-contain" />
          </div>
          <span className="text-1xl md:text-2xl lg:text-2xl font-bold leading-none">PawPal</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-left mb-2">
          {t('Welcome Back')}
        </h2>
        <p className="text-sm text-slate-600 mb-5">
          {t('Sign in to')}{" "}
          <span className="underline decoration-4 decoration-[#fdd14280]">
            {t('continue caring for paws')}
          </span>
          .
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t('Username')}
            required
            name="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
          />
          <input
            type="password"
            placeholder={t('Password')}
            required
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
          />

          <button
            type="submit"
            className="w-full px-6 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px] disabled:opacity-60 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? t('Logging in...') : t('Login')}
          </button>

          {/* Loader shows below button */}
          {loading && <div className="mt-2"><Loader /></div>}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-2">
              {error}
            </p>
          )}
        </form>

        <Link
          to="/signup"
          className="block text-center text-sm text-slate-800 bg-white border border-slate-200 rounded-full py-2 mt-5 hover:shadow-sm hover:-translate-y-[1px] transition"
        >
          {t("Don't have an account? Sign up")}
        </Link>

        {/* tiny floating accent inside card */}
        <div className="pointer-events-none absolute -top-4 -right-4 h-12 w-12 bg-[#fdd142] rounded-full opacity-70 animate-[float_6s_ease-in-out_infinite]" />
      </div>

      {/* keyframes to mirror LandingPage */}
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
};

export default LoginPage;
