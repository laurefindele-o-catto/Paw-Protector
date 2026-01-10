import React, { useEffect, useState } from "react";

const Vetcheckdiag = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/requests/pending", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        console.log("Fetched requests:", data);

        if (Array.isArray(data.requests)) {
          setRequests(data.requests);
        } else {
          setRequests([]);
        }
      } catch (err) {
        console.error("Failed to fetch diagnostics", err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden pt-28 px-4">
      
      {/* background effects */}
      <div className="pointer-events-none fixed -top-32 -left-16 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed top-40 -right-10 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
      <div className="pointer-events-none fixed bottom-10 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />

      {/* page container */}
      <section className="mx-auto max-w-6xl w-full">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-8">

          <h1 className="text-3xl font-bold mb-8 text-center">
            Pending Diagnostics
          </h1>

          {/* loading */}
          {loading && (
            <p className="text-center text-gray-500">
              Loading diagnostics...
            </p>
          )}

          {/* empty */}
          {!loading && requests.length === 0 && (
            <p className="text-center text-gray-500">
              No pending diagnostic requests.
            </p>
          )}

          {/* grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {requests.map((req) => (
              <div
                key={req._id}
                className="rounded-2xl border bg-white shadow-md hover:shadow-xl transition overflow-hidden flex flex-col"
              >
                {/* image */}
                <img
                  src={`http://localhost:3000${req.imageUrl}`}
                  alt="Diagnosis"
                  className="h-48 w-full object-cover"
                />

                {/* content */}
                <div className="p-5 flex flex-col gap-3 flex-grow">
                  <p className="text-sm">
                    <span className="font-semibold">AI Notes:</span>{" "}
                    {req.notes}
                  </p>

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full w-fit
                      ${
                        req.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    `}
                  >
                    {req.status.toUpperCase()}
                  </span>

                  <button
                    className="mt-auto w-full py-2 rounded-xl bg-[#0f172a] text-white font-semibold hover:bg-[#22304a] transition"
                  >
                    Review & Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bouncey {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
        }
      `}</style>
    </div>
  );
};

export default Vetcheckdiag;
