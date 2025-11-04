import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiConfig from "../config/apiConfig";

function VerificationProcessPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [clinicId, setClinicId] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [licenseIssuer, setLicenseIssuer] = useState("");
    const [licenseValidUntil, setLicenseValidUntil] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [photoUrl, setPhotoUrl] = useState(""); // placeholder for now

    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem("user"));
            setUser(u);
        } catch { }
    }, []);

    const safeParseError = async (res) => {
        try {
            return await res.json();
        } catch {
            return { error: await res.text() };
        }
    };

    const submitVerification = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!user?.id) {
            alert("User not found");
            return;
        }

        try {
            const res = await fetch(
                `${apiConfig.baseURL}${apiConfig.vets.update(user.id)}`, // your updateVet endpoint
                {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        clinic_id: clinicId,
                        license_number: licenseNumber,
                        license_issuer: licenseIssuer,
                        license_valid_until: licenseValidUntil,
                        specialization,
                        photo_url: photoUrl || null,
                        verified: true, // auto-verify logic here
                    }),
                }
            );

            if (!res.ok) {
                const err = await safeParseError(res);
                throw new Error(err?.error || "Failed to update vet profile");
            }

            const data = await res.json();
            alert("Verification submitted successfully!");
            // Optionally store updated vet info
            localStorage.setItem("vet_profile", JSON.stringify(data));
            navigate("/dashboard");
        } catch (err) {
            alert(err.message || "Verification failed");
        }
    };
    return (
        <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden">
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

            {/* back button */}
            <button
                onClick={() => navigate("/profile")}
                className="absolute top-6 left-6 flex items-center px-4 py-2 bg-black text-[#ffffff] rounded-lg shadow hover:bg-gray-700 transition z-20"
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
                Profile
            </button>

            <div className="relative mx-auto max-w-6xl px-6 py-14">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-9 w-9 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#edfdfd] font-bold text-xs">
                        PP
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                        Vet Verification
                    </h1>
                </div>
                <p className="text-slate-600 mb-10">
                    Please provide your{" "}
                    <span className="underline decoration-4 decoration-[#fdd14280]">
                        professional details
                    </span>{" "}
                    to complete verification.
                </p>

                {/* Form Card */}
                <form
                    onSubmit={submitVerification}
                    className="relative w-full max-w-[900px] mx-auto bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 md:p-10 animate-[slideup_0.6s_ease-out]"
                >
                    {/* tiny floating accent inside card */}
                    <div className="pointer-events-none absolute -top-4 -right-4 h-12 w-12 bg-[#fdd142] rounded-full opacity-70 animate-[float_6s_ease-in-out_infinite]" />

                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                                placeholder="Enter your name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Clinic ID</label>
                            <input
                                type="text"
                                value={clinicId}
                                onChange={e => setClinicId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                                placeholder="Enter clinic ID"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">License Number</label>
                            <input
                                type="text"
                                value={licenseNumber}
                                onChange={e => setLicenseNumber(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                                placeholder="Enter license number"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">License Issuer</label>
                            <input
                                type="text"
                                value={licenseIssuer}
                                onChange={e => setLicenseIssuer(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                                placeholder="Enter license issuer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">License Valid Until</label>
                            <input
                                type="date"
                                value={licenseValidUntil}
                                onChange={e => setLicenseValidUntil(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Specialization</label>
                            <input
                                type="text"
                                value={specialization}
                                onChange={e => setSpecialization(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                                placeholder="Enter specialization"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Photo URL (placeholder)</label>
                            <input
                                type="text"
                                value={photoUrl}
                                onChange={e => setPhotoUrl(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
                                placeholder="Enter photo URL"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="mt-8 w-full bg-[#0f172a] text-white py-3 rounded-full font-semibold hover:bg-slate-900 transition transform hover:-translate-y-[2px]"
                    >
                        Submit for Verification
                    </button>
                </form>
            </div>

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

export default VerificationProcessPage;