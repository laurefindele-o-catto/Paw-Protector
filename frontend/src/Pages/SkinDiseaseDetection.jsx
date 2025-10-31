import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export default function SkinDiseaseDetector() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
      setResult(uploadData.label || "No label returned");
    } catch (err) {
      setResult("Error processing image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between"
      style={{ backgroundColor: "#F7FAFC" }}
    >
      {/* Back to Dashboard Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="absolute top-6 left-6 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition z-20"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </button>
      {/* Header */}
      <header className="w-full flex flex-col items-center p-6">
        <div className="flex items-center justify-center w-full mb-2">
          <h1 className="text-4xl font-extrabold text-black text-center drop-shadow-lg tracking-wide">
            Skin Disease Detector
          </h1>
          {/* Instructions button */}
          <div className="relative group ml-4">
            <button
              className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
              aria-label="Instructions"
              type="button"
            >
              <span className="text-lg font-bold">i</span>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 bg-white border border-gray-300 rounded shadow-lg p-4 text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <p className="mb-2">
                <strong>Instructions:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Please capture and upload a clear, well-lit image of the affected area.
                </li>
                <li>
                  The system currently detects a limited range of skin anomalies. More diseases will be supported soon.
                </li>
                <li>
                  Click the box below to select and upload your image.
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="w-full border-b border-gray-200 mt-2"></div>
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow w-full">
        {/* File Picker Box */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
        <div
          onClick={handleBoxClick}
          className={`cursor-pointer flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-white shadow-lg transition hover:border-blue-500 hover:bg-blue-50 w-80 h-44 mb-6 ${
            file ? "border-blue-600" : "border-gray-400"
          }`}
        >
          {file ? (
            <>
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="rounded-lg shadow border border-gray-300 max-h-32 max-w-xs object-contain mb-2"
              />
              <span className="text-xs text-gray-500">Preview: {file.name}</span>
            </>
          ) : (
            <>
              <span className="text-5xl text-blue-400 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-12 h-12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4" />
                  <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
              <span className="text-lg font-medium text-gray-700">
                Click to select an image
              </span>
              <span className="text-xs text-gray-500 mt-1">
                (Supported: .jpg, .png, .jpeg)
              </span>
            </>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !file}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 font-semibold mb-8 transition"
        >
          {loading ? "Processing..." : "Upload & Detect"}
        </button>

        {/* Results box */}
        <div
          className={`mt-2 w-96 p-6 border-2 rounded-2xl shadow-lg flex flex-col items-center
    ${
      result && typeof result === "string" && result.toLowerCase() !== "healthy"
        ? "border-red-400 bg-red-100 bg-opacity-60"
        : "border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100"
    }
  `}
        >
          <h2 className={`font-bold text-xl mb-3 ${
    result && typeof result === "string" && result.toLowerCase() !== "healthy"
      ? "text-red-700"
      : "text-blue-700"
  }`}>Results</h2>
          <p className={`text-lg font-medium ${
    result === "Error processing image"
      ? "text-red-600"
      : "text-gray-800"
  }`}>
            {result ? result : "No results yet"}
          </p>
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="w-full text-center p-4 text-xs text-gray-600 border-t border-gray-300 bg-white">
        <span className="font-semibold text-red-500">Disclaimer:</span> This model may produce incorrect results. Please seek professional medical help if symptoms persist.
      </footer>
    </div>
  );
}