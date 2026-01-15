import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { usePet } from "../context/PetContext";
import apiConfig from "../config/apiConfig";

export default function HealthChecks() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const { currentPet } = usePet();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    if (!currentPet?.id) return items;
    return items.filter((r) => Number(r.pet_id) === Number(currentPet.id));
  }, [items, currentPet?.id]);

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    let alive = true;

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.healthChecks.mine}?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || data?.message || "Failed to load health checks");
        if (!alive) return;
        setItems(Array.isArray(data?.requests) ? data.requests : []);
      } catch (e) {
        if (!alive) return;
        setItems([]);
        setError(e?.message || "Failed to load health checks");
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, token]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#edfdfd] text-slate-900 mt-28">
        <section className="mx-auto max-w-6xl w-full px-4 py-8">
          <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-extrabold">My Pet Health Checks</h1>
                <p className="text-sm text-slate-600 mt-1">
                  {currentPet?.name ? `Showing requests for ${currentPet.name}.` : "Showing all your requests."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/find-a-vet")}
                  className="px-4 py-2 rounded-xl bg-[#fdd142] text-[#0f172a] font-semibold"
                >
                  New Request
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="px-4 py-2 rounded-xl border"
                >
                  Back
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-6 text-sm text-slate-600">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="mt-6 text-sm text-slate-600">No requests found.</div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4">
                {filtered.map((r) => {
                  const vetName = String(r.vet_full_name || "").trim() || String(r.vet_username || "").trim() || `Vet #${r.vet_user_id}`;
                  return (
                    <div key={String(r.id)} className="rounded-2xl bg-white border border-slate-100 p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{vetName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {r.created_at ? `Sent: ${new Date(r.created_at).toLocaleString()}` : ""}
                          </div>
                        </div>
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

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate(`/health-checks/${r.id}`)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50"
                        >
                          View details
                        </button>
                      </div>

                      {Array.isArray(r.image_urls) && r.image_urls.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {r.image_urls.slice(0, 5).map((u) => (
                            <a
                              key={u}
                              href={u}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                              title="Open image"
                            >
                              <img src={u} alt="upload" className="h-20 w-20 object-cover rounded-xl border" />
                            </a>
                          ))}
                        </div>
                      )}

                      {r.status === "responded" && r.vet_response && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="text-xs font-semibold text-slate-600">Vet response</div>
                          <div className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{r.vet_response}</div>
                          {r.responded_at && (
                            <div className="mt-2 text-[11px] text-slate-500">
                              {`Responded: ${new Date(r.responded_at).toLocaleString()}`}
                            </div>
                          )}
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
