import Footer from "../components/Footer";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VetHeader from "../components/VetHeader";
import apiConfig from "../config/apiConfig";

function CheckDiagnostics() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    const userLocal = JSON.parse(localStorage.getItem("user") || "null");
    if (userLocal?.roles?.[0] !== "vet") {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const loadPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.request.pending}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to fetch pending requests");
      }

      const list = Array.isArray(data?.requests)
        ? data.requests
        : Array.isArray(data?.result)
        ? data.result
        : [];
      setRequests(list);
    } catch (e) {
      setError(e?.message || "Failed to fetch pending requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateStatus = async (requestId, status) => {
    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.request.updateStatus(requestId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to update request status");
      }

      // remove from pending list after action
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      setError(e?.message || "Failed to update request status");
    }
  };

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

        <main className="mx-auto w-full max-w-5xl px-4 mt-10 flex-1">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                  {t("Pending Diagnostics")}
                </h1>
                <p className="text-slate-600 mt-1">
                  {t("Review uploaded cases and approve/reject.")}
                </p>
              </div>
              <button
                onClick={loadPending}
                className="px-4 py-2 rounded-xl bg-[#0f172a] text-[#edfdfd] font-semibold hover:bg-slate-900 transition"
                aria-label={t("Refresh pending requests")}
              >
                {t("Refresh")}
              </button>
            </div>

            <div className="mt-4" aria-live="polite">
              {loading && (
                <div className="text-slate-700 font-medium">{t("Loading...")}</div>
              )}
              {error && (
                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                  {t("Error")}: {error}
                </div>
              )}
            </div>

            {!loading && !error && requests.length === 0 && (
              <div className="mt-8 text-center text-slate-600">
                <div className="text-xl font-semibold">{t("No pending requests")}</div>
                <div className="mt-1 text-sm">{t("New uploads will appear here.")}</div>
              </div>
            )}

            {requests.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {requests.map((r) => (
                  <article
                    key={r.id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          {t("Request")} #{r.id}
                        </h2>
                        <p className="text-sm text-slate-600">
                          {t("Owner ID")}: {r.issue_user_id}
                        </p>
                        {r.created_at && (
                          <p className="text-xs text-slate-500 mt-1">
                            {t("Created")}: {new Date(r.created_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span
                        className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800"
                        aria-label={t("Pending")}
                      >
                        {t("Pending")}
                      </span>
                    </div>

                    {r.notes && (
                      <p className="mt-3 text-sm text-slate-700">
                        <span className="font-semibold">{t("Notes")}: </span>
                        {r.notes}
                      </p>
                    )}

                    {r.content_url && (
                      <div className="mt-4">
                        <img
                          src={r.content_url}
                          alt={`${t("Diagnostic attachment for request")} ${r.id}`}
                          className="w-full h-56 object-cover rounded-xl border"
                          loading="lazy"
                        />
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <a
                            href={r.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-slate-800 underline"
                            aria-label={`${t("Open attachment for request")} ${r.id}`}
                          >
                            {t("Open attachment")}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => updateStatus(r.id, true)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                        aria-label={`${t("Approve request")} ${r.id}`}
                      >
                        {t("Approve")}
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, false)}
                        className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                        aria-label={`${t("Reject request")} ${r.id}`}
                      >
                        {t("Reject")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>

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