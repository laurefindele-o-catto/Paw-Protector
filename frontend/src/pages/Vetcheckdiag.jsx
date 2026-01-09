
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
        setRequests(data);
      } catch (err) {
        console.error("Failed to fetch diagnostics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) return <p>Loading pending diagnostics...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Diagnostics</h1>

      {requests.length === 0 && (
        <p className="text-gray-500">No pending requests.</p>
      )}

      <div className="grid gap-6">
        {requests.map((req) => (
          <div
            key={req._id}
            className="border rounded-xl p-4 shadow bg-white"
          >
            <img
              src={`http://localhost:3000${req.imageUrl}`}
              alt="Diagnosis"
              className="w-full h-48 object-cover rounded mb-3"
            />

            <p className="mb-2">
              <strong>AI Notes:</strong> {req.notes}
            </p>

            <p className="text-sm text-gray-500 mb-3">
              Status: {req.status}
            </p>

            <button className="px-4 py-2 bg-black text-white rounded">
              Review & Approve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


export default Vetcheckdiag;