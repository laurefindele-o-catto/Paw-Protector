import Header from "../components/Header";
import Footer from "../Components/Footer";

function CheckDiagnostics() {
  return (
    <>
      
      <div className="relative min-h-screen flex flex-col bg-[#edfdfd] text-slate-900 overflow-hidden mt-28">
        {/* animated background shapes */}
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

        {/* Placeholder Content */}
        <div className="flex flex-1 items-center justify-center">
          <span className="text-5xl md:text-7xl font-bold text-gray-400 opacity-70 select-none">
            This is a placeholder
          </span>
        </div>

        {/* Bottom spacing */}
        <br /><br /><br /><br />
      </div>
      <Footer />

      {/* keyframes */}
      <style>{`
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

export default CheckDiagnostics;