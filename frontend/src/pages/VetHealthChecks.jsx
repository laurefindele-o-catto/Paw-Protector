import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VetHeader from "../components/VetHeader";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import apiConfig from "../config/apiConfig";

export default function VetHealthChecks() {
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();

  const [tab, setTab] = useState("pending"); // 'pending' | 'all'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [draftResponses, setDraftResponses] = useState({});
  const [actionLoadingMap, setActionLoadingMap] = useState({});

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
    const userLocal = user || JSON.parse(localStorage.getItem("user"));
    if (userLocal?.roles?.[0] !== "vet") navigate("/");
  }, [isAuthenticated, navigate, user]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const url =
        tab === "pending"
          ? `${apiConfig.baseURL}${apiConfig.healthChecks.vetPending}?limit=50`
          : `${apiConfig.baseURL}${apiConfig.healthChecks.vetAll()}?limit=50`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to load health checks");
      setItems(Array.isArray(data?.requests) ? data.requests : []);
    } catch (e) {
      setItems([]);
      setError(e?.message || "Failed to load health checks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, tab]);

  const setActionLoading = (id, value) => {
    setActionLoadingMap((m) => ({ ...m, [id]: value }));
  };

  const submitResponse = async (reqId) => {
    const text = String(draftResponses[reqId] || "").trim();
    if (!text) {
      setError("Please write a response before submitting.");
      return;
    }

    setActionLoading(reqId, true);
    setError("");
    setNotice("");

    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.healthChecks.respond(reqId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vet_response: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to submit response");

      setNotice("Response submitted successfully.");
      setDraftResponses((d) => {
        const next = { ...d };
        delete next[reqId];
        return next;
      });

      // Update list in-place
      setItems((prev) =>
        prev.map((r) => (Number(r.id) === Number(reqId) ? { ...r, status: "responded", vet_response: text, responded_at: new Date().toISOString() } : r))
      );
      if (tab === "pending") {
        setItems((prev) => prev.filter((r) => Number(r.id) !== Number(reqId)));
      }
    } catch (e) {
      setError(e?.message || "Failed to submit response");
    } finally {
      setActionLoading(reqId, false);
    }
  };

  return (
    <>
      <VetHeader />
      <main className="min-h-screen bg-[#edfdfd] text-slate-900 mt-28">
        <section className="mx-auto max-w-6xl w-full px-4 py-8">
          <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-extrabold">Pet Health Check Inbox</h1>
                <p className="text-sm text-slate-600 mt-1">Review consult requests and respond.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/vdashboard")}
                  className="px-4 py-2 rounded-xl border"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={load}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#0f172a] text-[#edfdfd] font-semibold disabled:opacity-60"
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setTab("pending")}
                className={
                  "px-4 py-2 rounded-xl text-sm font-semibold border " +
                  (tab === "pending" ? "bg-[#fdd142] text-[#0f172a] border-[#fdd142]" : "bg-white")
                }
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setTab("all")}
                className={
                  "px-4 py-2 rounded-xl text-sm font-semibold border " +
                  (tab === "all" ? "bg-[#fdd142] text-[#0f172a] border-[#fdd142]" : "bg-white")
                }
              >
                All
              </button>
            </div>

            {notice && !error && (
              <div className="mt-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                {notice}
              </div>
            )}
            {error && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-6 text-sm text-slate-600">Loading...</div>
            ) : items.length === 0 ? (
              <div className="mt-6 text-sm text-slate-600">No requests found.</div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-4">
                {items.map((r) => {
                  const ownerName = String(r.owner_full_name || "").trim() || String(r.owner_username || "").trim() || `Owner #${r.owner_user_id}`;
                  const petName = String(r.pet_name || "").trim() || (r.pet_id ? `Pet #${r.pet_id}` : "Unknown pet");
                  const busy = !!actionLoadingMap[r.id];

                  return (
                    <div key={String(r.id)} className="rounded-2xl bg-white border border-slate-100 p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{petName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {ownerName}{r.created_at ? ` • ${new Date(r.created_at).toLocaleString()}` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/health-checks/${r.id}`)}
                          className="text-xs font-semibold px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50"
                        >
                          View details
                        </button>
                        <div
                          className={
                            "text-xs font-semibold px-3 py-1 rounded-full " +
                            (r.status === "responded"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200")
                          }
                        >
                          {r.status === "responded" ? "Responded" : "Pending"}
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-slate-800 whitespace-pre-wrap">{r.problem_text}</div>

                      {Array.isArray(r.image_urls) && r.image_urls.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {r.image_urls.slice(0, 5).map((u) => (
                            <a key={u} href={u} target="_blank" rel="noreferrer" className="block" title="Open image">
                              <img src={u} alt="upload" className="h-20 w-20 object-cover rounded-xl border" />
                            </a>
                          ))}
                        </div>
                      )}

                      {r.status === "responded" && r.vet_response ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="text-xs font-semibold text-slate-600">Your response</div>
                          <div className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{r.vet_response}</div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <label className="block text-xs font-medium text-slate-600 mb-2">Write response</label>
                          <textarea
                            rows={3}
                            value={draftResponses[r.id] ?? ""}
                            onChange={(e) => setDraftResponses((d) => ({ ...d, [r.id]: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                            placeholder="Advice, medication suggestions, next steps..."
                            disabled={busy}
                          />
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => submitResponse(r.id)}
                              disabled={busy}
                              className="px-5 py-2 rounded-xl bg-[#0f172a] text-[#edfdfd] font-semibold disabled:opacity-60"
                            >
                              {busy ? "Submitting..." : "Submit Response"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
