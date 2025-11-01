// SkinDiseaseDetection.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAutoTranslate } from "react-autolocalise";

export default function SkinDiseaseDetector() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useAutoTranslate();

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const token = localStorage.getItem("token");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleBoxClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const uploadRes = await fetch(
        "https://pritombiswas9999-disease-classifier.hf.space/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadRes.ok) {
        throw new Error("Image upload failed");
      }

      const uploadData = await uploadRes.json();
      // keep raw label as-is (don't translate ML output)
      setResult(uploadData.label || "No label returned");
    } catch (err) {
      // use a fixed English sentinel for logic; translate only when rendering
      setResult("Error processing image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden flex flex-col">
      {/* animated background shapes (LandingPage palette) */}
      <div className="pointer-events-none fixed -top-28 -left-20 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed top-48 -right-8 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
      <div className="pointer-events-none fixed bottom-14 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed -bottom-28 right-24 h-72 w-72 border-[18px] border-[#fdd142]/20 rounded-full animate-[spin_20s_linear_infinite]" />

      {/* diagonal dots accent */}
      <div className="pointer-events-none absolute -top-6 right-8 h-32 w-32 opacity-30 animate-[slideDots_10s_linear_infinite]">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#0f172a]/40" />
          ))}
        </div>
      </div>

      {/* Back to Dashboard Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="absolute top-6 left-6 flex items-center px-4 py-2 bg-black text-[#ffffff] rounded-lg shadow hover:bg-gray-700 transition z-20"
        aria-label="Back to dashboard"
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
        Dashboard
      </button>

      {/* Header */}
      <header className="w-full flex flex-col items-center p-6">
        <div className="flex items-center justify-center w-full mb-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 text-center drop-shadow-sm tracking-wide">
            {t("Skin Disease Detector")}
          </h1>

          {/* Instructions button */}
          <div className="relative group ml-4">
            <button
              className="w-9 h-9 flex items-center justify-center bg-[#0f172a] text-[#edfdfd] rounded-full shadow hover:bg-slate-900 transition"
              aria-label={t("Instructions")}
              type="button"
            >
              <span className="text-lg font-bold">i</span>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-lg p-4 text-sm text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <p className="mb-2">
                <strong>{t("Instructions:")}</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t("Upload a clear, well-lit image of the affected area.")}</li>
                <li>{t("Currently detects a limited set of anomalies.")}</li>
                <li>{t("Click the box below to select an image.")}</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="w-full border-b border-slate-200 mt-2" />
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow w-full px-6">
        {/* File Picker (hidden input preserved) */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: "none" }}
          aria-label={t("Select image")}
        />

        {/* Card wrapper */}
        <div className="relative w-full max-w-2xl bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 md:p-8 animate-[slideup_0.6s_ease-out]">
          {/* small brand chip */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#edfdfd] font-bold text-xs">
              PP
            </div>
            <span className="font-semibold tracking-tight text-slate-900">PawPal</span>
          </div>

          <p className="text-sm text-slate-600 mb-5">
            <span className="underline decoration-4 decoration-[#fdd14280]">
              {t("Analyze your pet’s skin")}
            </span>{" "}
            {t("by uploading a photo.")}
          </p>

          {/* File Picker Box */}
          <div
            onClick={handleBoxClick}
            className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-white/70 hover:bg-white/90 transition w-full h-48 mb-6 ${
              file ? "border-[#0f172a]" : "border-slate-300 hover:border-[#fdd142]"
            }`}
            aria-label={t("Click to select an image")}
            role="button"
          >
            {file ? (
              <>
                <img
                  src={URL.createObjectURL(file)}
                  alt={t("Preview")}
                  className="rounded-xl shadow border border-slate-200 max-h-36 max-w-full object-contain mb-2"
                />
                <span className="text-xs text-slate-500">
                  {t("Preview:")} {file.name}
                </span>
              </>
            ) : (
              <>
                <span className="text-5xl text-slate-400 mb-2" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.2}
                    stroke="currentColor"
                    className="w-12 h-12"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4" />
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                <span className="text-base font-medium text-slate-700">
                  {t("Click to select an image")}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  {t("(Supported: .jpg, .png, .jpeg)")}
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className="w-full px-6 py-3 rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px] disabled:opacity-60"
            aria-label={t("Upload and detect")}
          >
            {loading ? t("Processing...") : t("Upload & Detect")}
          </button>

          {/* Results box */}
          <div
            className={`mt-6 w-full p-6 border-2 rounded-2xl shadow-sm ${
              result && typeof result === "string" && result.toLowerCase() !== "healthy"
                ? "border-red-400 bg-red-50"
                : "border-emerald-400 bg-emerald-50"
            }`}
          >
            <h2
              className={`font-bold text-xl mb-2 ${
                result && typeof result === "string" && result.toLowerCase() !== "healthy"
                  ? "text-red-700"
                  : "text-emerald-700"
              }`}
            >
              {t("Results")}
            </h2>
            <p
              className={`text-lg font-medium ${
                result === "Error processing image" ? "text-red-600" : "text-slate-800"
              }`}
              aria-live="polite"
            >
              {/* show translated messages for app-status strings; keep ML label raw */}
              {result
                ? result === "Error processing image"
                  ? t("Error processing image")
                  : result
                : t("No results yet")}
            </p>
          </div>

          {/* tiny floating accent inside card */}
          <div className="pointer-events-none absolute -top-4 -right-4 h-12 w-12 bg-[#fdd142] rounded-full opacity-70 animate-[float_6s_ease-in-out_infinite]" />
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="w-full text-center p-4 text-xs text-slate-600 border-t border-slate-200 bg-white/70 backdrop-blur">
        <span className="font-semibold text-red-500">{t("Disclaimer:")}</span>{" "}
        {t(
          "This model may produce incorrect results. Please seek professional medical help if symptoms persist."
        )}
      </footer>

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
