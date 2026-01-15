import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import VetHeader from "../components/VetHeader";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import apiConfig from "../config/apiConfig";

function safeString(v) {
  return String(v ?? "").trim();
}

function JsonBlock({ value }) {
  return (
    <pre className="mt-2 w-full overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[12px] leading-relaxed text-slate-800">
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
}

function SummarySection({ summary }) {
  if (!summary) {
    return <div className="text-sm text-slate-600">No health record was attached to this request.</div>;
  }

  const latestWeight = summary?.metrics?.latestWeightKg ?? null;
  const latestTemp = summary?.metrics?.latestTempC ?? null;
  const lastCheck = summary?.metrics?.trend?.[0]?.measured_at ?? null;

  const diseasesAll =
    summary?.diseases?.all || [
      ...(summary?.diseases?.active || []),
      ...(summary?.diseases?.resolved || []),
    ];
  const vaccinesRecent = summary?.vaccinations?.recent || [];
  const dewormRecent = summary?.dewormings?.recent || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="text-xs text-slate-500">Latest weight</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">{latestWeight ?? "—"} kg</div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="text-xs text-slate-500">Latest temperature</div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">{latestTemp ?? "—"} °C</div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="text-xs text-slate-500">Last check</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {lastCheck ? new Date(lastCheck).toLocaleString() : "—"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="text-sm font-bold text-slate-900">Diseases</div>
        {diseasesAll.length === 0 ? (
          <div className="mt-2 text-sm text-slate-600">No diseases recorded.</div>
        ) : (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {diseasesAll.slice(0, 12).map((d, idx) => (
              <div key={d.id ?? idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-semibold text-slate-900">{d.disease_name || "Unnamed"}</div>
                <div className="text-xs text-slate-600 mt-1">Status: {d.status || "—"}</div>
                {d.symptoms ? <div className="text-xs text-slate-600">Symptoms: {d.symptoms}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="text-sm font-bold text-slate-900">Vaccinations</div>
          {vaccinesRecent.length === 0 ? (
            <div className="mt-2 text-sm text-slate-600">No vaccinations recorded.</div>
          ) : (
            <div className="mt-2 space-y-2">
              {vaccinesRecent.slice(0, 6).map((v, idx) => (
                <div key={v.id ?? idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-semibold text-slate-900">{v.vaccine_name || "Vaccine"}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Administered: {v.administered_on ? new Date(v.administered_on).toLocaleDateString() : "—"}
                    {v.due_on ? ` • Due: ${new Date(v.due_on).toLocaleDateString()}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <div className="text-sm font-bold text-slate-900">Deworming</div>
          {dewormRecent.length === 0 ? (
            <div className="mt-2 text-sm text-slate-600">No deworming recorded.</div>
          ) : (
            <div className="mt-2 space-y-2">
              {dewormRecent.slice(0, 6).map((d, idx) => (
                <div key={d.id ?? idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-semibold text-slate-900">{d.product_name || "Deworming"}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Administered: {d.administered_on ? new Date(d.administered_on).toLocaleDateString() : "—"}
                    {d.due_on ? ` • Due: ${new Date(d.due_on).toLocaleDateString()}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Raw attached summary (debug)</summary>
        <JsonBlock value={summary} />
      </details>
    </div>
  );
}

export default function HealthCheckDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, token, user } = useAuth();

  const isVet = Array.isArray(user?.roles) ? user.roles.includes("vet") : user?.roles?.[0] === "vet";

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const backTo = isVet ? "/vetHealthChecks" : "/health-checks";

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const reqId = Number(id);
    if (!Number.isFinite(reqId)) {
      setError("Invalid request id");
      return;
    }

    let alive = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.healthChecks.getById(reqId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || data?.message || "Failed to load request");
        if (!alive) return;
        setItem(data?.request || null);
      } catch (e) {
        if (!alive) return;
        setItem(null);
        setError(e?.message || "Failed to load request");
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, token, id]);

  const healthProfile = item?.health_profile || null;
  const attachedSummary = healthProfile?.summary ?? null;

  const title = useMemo(() => {
    const petName = safeString(item?.pet_name);
    if (petName) return `Health Check • ${petName}`;
    return "Health Check Details";
  }, [item?.pet_name]);

  return (
    <>
      {isVet ? <VetHeader /> : <Header />}
      <main className="min-h-screen bg-[#edfdfd] text-slate-900 mt-28">
        <section className="mx-auto max-w-6xl w-full px-4 py-8">
          <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-extrabold">{title}</h1>
                <p className="text-sm text-slate-600 mt-1">
                  {item?.created_at ? `Created: ${new Date(item.created_at).toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => navigate(backTo)} className="px-4 py-2 rounded-xl border">
                  Back
                </button>
                {!isVet && (
                  <button
                    type="button"
                    onClick={() => navigate("/find-a-vet")}
                    className="px-4 py-2 rounded-xl bg-[#fdd142] text-[#0f172a] font-semibold"
                  >
                    New Request
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-6 text-sm text-slate-600">Loading...</div>
            ) : !item ? (
              <div className="mt-6 text-sm text-slate-600">No details found.</div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-xs text-slate-500">Pet</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {safeString(item.pet_name) || (item.pet_id ? `Pet #${item.pet_id}` : "—")}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {[
                        safeString(item.pet_species),
                        safeString(item.pet_breed),
                        safeString(item.pet_sex),
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-xs text-slate-500">Owner</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {safeString(item.owner_full_name) || safeString(item.owner_username) || (item.owner_user_id ? `Owner #${item.owner_user_id}` : "—")}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-xs text-slate-500">Vet</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {safeString(item.vet_full_name) || safeString(item.vet_username) || (item.vet_user_id ? `Vet #${item.vet_user_id}` : "—")}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm font-bold text-slate-900">Problem</div>
                    <div
                      className={
                        "text-xs font-semibold px-3 py-1 rounded-full border " +
                        (item.status === "responded"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200")
                      }
                    >
                      {item.status === "responded" ? "Responded" : "Pending"}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-800 whitespace-pre-wrap">{item.problem_text}</div>

                  {Array.isArray(item.image_urls) && item.image_urls.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.image_urls.slice(0, 5).map((u) => (
                        <a key={u} href={u} target="_blank" rel="noreferrer" className="block" title="Open image">
                          <img src={u} alt="upload" className="h-24 w-24 object-cover rounded-xl border" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {item.status === "responded" && item.vet_response && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-900">Doctor's feedback</div>
                    <div className="mt-2 text-sm text-slate-900 whitespace-pre-wrap">{item.vet_response}</div>
                    {item.responded_at && (
                      <div className="mt-2 text-[11px] text-slate-500">
                        {`Responded: ${new Date(item.responded_at).toLocaleString()}`}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm font-bold text-slate-900">Attached health record</div>
                  </div>

                  <div className="mt-3">
                    <SummarySection summary={attachedSummary} />
                  </div>

                  {healthProfile && !attachedSummary && (
                    <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900">Raw attached health_profile (debug)</summary>
                      <JsonBlock value={healthProfile} />
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
