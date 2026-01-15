// src/pages/vetFinder.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import apiConfig from "../config/apiConfig";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { usePet } from "../context/PetContext";

/** Load Google Maps JS (Places) once */
function useGooglePlaces(explicitKey) {
  const [loaded, setLoaded] = useState(false);
  const [missingKey, setMissingKey] = useState(false);
  

  useEffect(() => {
    const keyFromEnv = typeof import.meta !== "undefined" ? import.meta.env?.VITE_GOOGLE_MAPS_API_KEY : "";
    const key = explicitKey || keyFromEnv;

    if (!key) {
      setMissingKey(true);
      return;
    }
    if (window.google?.maps?.places) { setLoaded(true); return; }

    const id = "gmaps-script";
    if (document.getElementById(id)) return;

    const s = document.createElement("script");
    s.id = id;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    s.async = true;
    s.onload = () => setLoaded(true);
    s.onerror = () => setMissingKey(true);
    document.body.appendChild(s);
  }, [explicitKey]);

  return { loaded, missingKey };
}

const DEFAULT_CENTER = { lat: 23.7808875, lng: 90.2792371 }; // Dhaka
const DEFAULT_RADIUS_M = 8000; // 8 km default
const PLACEHOLDER_IMG = "/placeholder.png"; // keep in /public

// ---- Places status helper messages (for clearer errors) ----
const STATUS_MESSAGES = {
  OK: "OK",
  ZERO_RESULTS: "No nearby vets found in the selected radius.",
  OVER_QUERY_LIMIT: "Query limit hit for your key (try again later).",
  REQUEST_DENIED: "Request denied (check API restrictions / Places API).",
  INVALID_REQUEST: "Invalid request (check params).",
  UNKNOWN_ERROR: "Temporary server error; try again.",
};
const statusToMessage = (status, fallback = "No results.") => STATUS_MESSAGES[status] || fallback;
// ------------------------------------------------------------

export default function VetFinder() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const { currentPet, currentPetSummary } = usePet();

  // Address + place state
  const [addressLine, setAddressLine] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // UI state
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showEmptyAddressPopup, setShowEmptyAddressPopup] = useState(false);

  // Map refs
  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const placesServiceRef = useRef(null);
  const listMarkersRef = useRef([]);

  const addressInputRef = useRef(null);
  const healthFileInputRef = useRef(null);

  // Config + Google loader
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.replace(/"/g, "");
  const { loaded: googleLoaded, missingKey } = useGooglePlaces(googleMapsApiKey);

  // --- Pet Health Check (owner -> vet consult) ---
  const [vets, setVets] = useState([]);
  const [vetsLoading, setVetsLoading] = useState(false);
  const [vetsError, setVetsError] = useState("");

  const [selectedVetId, setSelectedVetId] = useState("");
  const [problemText, setProblemText] = useState("");
  const [healthFiles, setHealthFiles] = useState([]);
  const [healthSubmitting, setHealthSubmitting] = useState(false);
  const [healthNotice, setHealthNotice] = useState("");
  const [healthError, setHealthError] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    const run = async () => {
      setVetsLoading(true);
      setVetsError("");
      try {
        // Prefer verified vets for production, but fall back to all vets in dev/test
        const tryFetch = async (url) => {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || data?.message || "Failed to load vets");
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.vets)) return data.vets;
          if (Array.isArray(data?.result)) return data.result;
          if (Array.isArray(data?.data)) return data.data;
          return [];
        };

        const verifiedUrl = `${apiConfig.baseURL}${apiConfig.vets.list}?verified=true`;
        const allUrl = `${apiConfig.baseURL}${apiConfig.vets.list}`;

        let list = await tryFetch(verifiedUrl);
        if (list.length === 0) {
          list = await tryFetch(allUrl);
        }

        if (alive) setVets(list);
      } catch (e) {
        if (alive) {
          setVets([]);
          setVetsError(e?.message || "Failed to load vets");
        }
      } finally {
        if (alive) setVetsLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [token]);

  const uploadHealthImages = async (files) => {
    if (!files || files.length === 0) return [];
    const fd = new FormData();
    files.slice(0, 5).forEach((f) => fd.append("files", f));
    const res = await fetch(`${apiConfig.baseURL}${apiConfig.healthChecks.upload}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || data?.message || "Failed to upload images");
    return Array.isArray(data?.urls) ? data.urls : [];
  };

  const submitHealthCheck = async () => {
    const vetIdNum = Number(selectedVetId);
    if (!Number.isFinite(vetIdNum)) {
      setHealthError("Please select a vet");
      return;
    }
    if (!problemText.trim()) {
      setHealthError("Please describe the problem");
      return;
    }

    setHealthSubmitting(true);
    setHealthError("");
    setHealthNotice("");

    try {
      const urls = await uploadHealthImages(healthFiles);

      const healthProfile = {
        pet: currentPet ? { id: currentPet.id, name: currentPet.name, species: currentPet.species } : null,
        summary: currentPetSummary ?? null,
        submitted_at: new Date().toISOString(),
      };

      const res = await fetch(`${apiConfig.baseURL}${apiConfig.healthChecks.create}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vet_user_id: vetIdNum,
          pet_id: currentPet?.id ?? null,
          problem_text: problemText,
          image_urls: urls,
          health_profile: healthProfile,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to create request");

      setHealthNotice("Request sent to vet successfully.");
      setProblemText("");
      setSelectedVetId("");
      setHealthFiles([]);
    } catch (e) {
      setHealthError(e?.message || "Failed to create request");
    } finally {
      setHealthSubmitting(false);
      setPaymentOpen(false);
    }
  };

  // Hydrate user's saved location
  useEffect(() => {
    const loadMyLocations = async () => {
      try {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.users.locations.listMine}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const first = data?.locations?.[0];
        if (first) {
          setAddressLine(first.address_line || "");
          setPlaceId(first.place_id || "");
          if (typeof first.latitude === "number" && typeof first.longitude === "number") {
            setLatitude(first.latitude);
            setLongitude(first.longitude);
          }
        }
      } catch {/* ignore */}
    };
    if (token && apiConfig?.users?.locations?.listMine) loadMyLocations();
  }, [token]);

  /** Attach Places Autocomplete to the input */
  useEffect(() => {
    if (!googleLoaded || !addressInputRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      fields: ["formatted_address", "geometry", "place_id"],
    });

    ac.addListener("place_changed", () => {
      const p = ac.getPlace();
      if (!p) return;

      setAddressLine(p.formatted_address || "");
      setPlaceId(p.place_id || "");

      if (p.geometry?.location) {
        const lat = p.geometry.location.lat();
        const lng = p.geometry.location.lng();
        setLatitude(lat);
        setLongitude(lng);
        if (mapRef.current) {
          mapRef.current.setCenter({ lat, lng });
          mapRef.current.setZoom(15);
        }
        if (markerRef.current) markerRef.current.setPosition({ lat, lng });
      }
    });
  }, [googleLoaded]);

  /** Initialize map + geocoder + places service */
  useEffect(() => {
    if (!googleLoaded || !mapElRef.current) return;

    if (!geocoderRef.current) geocoderRef.current = new window.google.maps.Geocoder();

    const center = {
      lat: typeof latitude === "number" ? latitude : DEFAULT_CENTER.lat,
      lng: typeof longitude === "number" ? longitude : DEFAULT_CENTER.lng,
    };

    mapRef.current = new window.google.maps.Map(mapElRef.current, {
      center,
      zoom: typeof latitude === "number" && typeof longitude === "number" ? 15 : 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    markerRef.current = new window.google.maps.Marker({
      position: center,
      map: mapRef.current,
      draggable: true,
      title: "Your selected address",
    });

    placesServiceRef.current = new window.google.maps.places.PlacesService(mapRef.current);

    mapRef.current.addListener("click", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateFromLatLng(lat, lng);
    });

    markerRef.current.addListener("dragend", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateFromLatLng(lat, lng);
    });
  }, [googleLoaded]); // init once

  // When lat/lng changes later (from saved location), re-center & place marker
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (typeof latitude === "number" && typeof longitude === "number") {
      const pos = { lat: latitude, lng: longitude };
      mapRef.current.setCenter(pos);
      mapRef.current.setZoom(15);
      markerRef.current.setPosition(pos);
    }
  }, [latitude, longitude]);

  /** Reverse geocode and update address on lat/lng changes from map */
  const updateFromLatLng = async (lat, lng) => {
    try {
      setLatitude(lat);
      setLongitude(lng);
      if (markerRef.current) markerRef.current.setPosition({ lat, lng });
      if (mapRef.current) mapRef.current.setCenter({ lat, lng });

      if (!geocoderRef.current) return;
      const { results } = await geocoderRef.current.geocode({ location: { lat, lng } });
      if (results && results.length) {
        setAddressLine(results[0].formatted_address || "");
        setPlaceId(results[0].place_id || "");
      } else {
        setAddressLine((prev) => prev || "");
        setPlaceId((prev) => prev || "");
      }
    } catch { /* keep lat/lng even if reverse fails */ }
  };

  /** Use browser geolocation */
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateFromLatLng(lat, lng);
        if (mapRef.current) mapRef.current.setZoom(15);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  /** Haversine distance in km */
  const distanceKm = (a, b) => {
    if (!a || !b) return Infinity;
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s1 = Math.sin(dLat / 2) ** 2;
    const s2 = Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s1 + s2));
  };

  /** Clear previous result markers */
  const clearResultMarkers = () => {
    listMarkersRef.current.forEach((m) => m.setMap(null));
    listMarkersRef.current = [];
  };

  // ---------------------------- Places: Search flow ----------------------------
  const findVets = () => {
    setErrorMsg("");

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      setShowEmptyAddressPopup(true);
      return;
    }
    if (!placesServiceRef.current) {
      setErrorMsg("Places service not ready. Try again in a moment.");
      return;
    }

    setIsSearching(true);
    clearResultMarkers();

    const originLatLng = new window.google.maps.LatLng(latitude, longitude);

    const nearbyReq = {
      location: originLatLng,
      radius: DEFAULT_RADIUS_M,
      type: "veterinary_care", // must be string
      keyword: "vet animal hospital clinic",
    };

    placesServiceRef.current.nearbySearch(nearbyReq, (res, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && res?.length) {
        handlePlacesResults(res, { lat: latitude, lng: longitude });
        return;
      }
      if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
        setIsSearching(false);
        setResults([]);
        setErrorMsg(
          "Places request denied. Check: 1) Places API is enabled, 2) HTTP referrer includes your origin, 3) Billing is enabled."
        );
        return;
      }

      // Fallback to text search
      const textReq = { location: originLatLng, radius: DEFAULT_RADIUS_M, query: "veterinary clinic" };
      placesServiceRef.current.textSearch(textReq, (res2, status2) => {
        setIsSearching(false);
        if (status2 === window.google.maps.places.PlacesServiceStatus.OK && res2?.length) {
          handlePlacesResults(res2, { lat: latitude, lng: longitude });
          return;
        }
        setResults([]);
        setErrorMsg(statusToMessage(status2 || status, "No nearby vets found."));
      });
    });
  };

  function handlePlacesResults(res, origin) {
    const formatted = res
      .map((p) => {
        const loc = {
          lat: p.geometry?.location?.lat?.() ?? 0,
          lng: p.geometry?.location?.lng?.() ?? 0,
        };

        let photoUrl = PLACEHOLDER_IMG;
        if (p.photos?.[0]) {
          try {
            photoUrl = p.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 });
          } catch { photoUrl = PLACEHOLDER_IMG; }
        }

        const openNow = p.opening_hours?.open_now ?? null;

        return {
          place_id: p.place_id,
          name: p.name,
          rating: p.rating,
          userRatingsTotal: p.user_ratings_total,
          vicinity: p.vicinity,
          openingNow: openNow,
          location: loc,
          distanceKm: Number(distanceKm(origin, loc).toFixed(2)),
          photoUrl,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    setResults(formatted);
    dropMarkersAndFit(formatted, origin);
    setIsSearching(false);
  }

  function dropMarkersAndFit(items, origin) {
    listMarkersRef.current.forEach((m) => m.setMap(null));
    listMarkersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(new window.google.maps.LatLng(origin.lat, origin.lng));

    items.forEach((r, idx) => {
      const marker = new window.google.maps.Marker({
        position: r.location,
        map: mapRef.current,
        label: `${idx + 1}`,
        title: r.name,
      });
      listMarkersRef.current.push(marker);

      const infowindow = new window.google.maps.InfoWindow({
        content: `<div style="font-size:14px"><strong>${r.name}</strong><br/>${r.vicinity || ""}<br/>${r.distanceKm} km</div>`,
      });

      marker.addListener("click", () => {
        infowindow.open({ anchor: marker, map: mapRef.current });
      });

      bounds.extend(new window.google.maps.LatLng(r.location.lat, r.location.lng));
    });

    mapRef.current.fitBounds(bounds);
  }
  // ---------------------------------------------------------------------------

  /** Focus on a selected result card */
  const focusResult = (idx) => {
    const r = results[idx];
    if (!r || !mapRef.current) return;
    mapRef.current.setCenter(r.location);
    mapRef.current.setZoom(17);
    const marker = listMarkersRef.current[idx];
    if (marker) {
      new window.google.maps.InfoWindow({
        content: `<div style="font-size:14px"><strong>${r.name}</strong><br/>${r.vicinity || ""}<br/>${r.distanceKm} km</div>`,
      }).open({ anchor: marker, map: mapRef.current });
    }
  };

  return (
    <>
      <Header/>
      <div className="min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden relative flex flex-col mt-28">
        {/* animated background shapes (mirrors LandingPage vibe) */}
        <div className="pointer-events-none fixed -top-32 -left-16 h-52 w-52 bg-[#fdd142]/60 rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite]" />
        <div className="pointer-events-none fixed top-40 -right-10 h-40 w-40 bg-[#fdd142]/50 rounded-full blur-2xl animate-[float_5s_ease-in-out_infinite_alternate]" />
        <div className="pointer-events-none fixed bottom-10 left-10 h-16 w-16 bg-[#fdd142] rounded-full opacity-80 animate-[bouncey_4s_ease-in-out_infinite]" />
        <div className="pointer-events-none fixed -bottom-24 right-20 h-72 w-72 border-18 border-[#fdd142]/20 rounded-full animate-[spin_20s_linear_infinite]" />
        {/* MAIN */}
        {missingKey && (
          <div className="mx-4 md:mx-16 mt-2 mb-2 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm z-20">
            Google Maps key not found. Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your .env file to enable address search and map features.
          </div>
        )}

      <div className="grid grid-cols-2 mt-10">

        {/* Pet Health Check consult (owner -> selected vet) */}
        <section className="px-6 md:px-16 pb-4 relative z-10">
          <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Pet Health Check</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Send a consult request to a vet (dummy payment step).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!String(selectedVetId || "").trim()) {
                    setHealthError("Please select a vet");
                    return;
                  }
                  setPaymentOpen(true);
                }}
                disabled={healthSubmitting}
                className="rounded-full bg-[#fdd142] px-5 py-2 text-sm font-semibold text-[#0f172a] hover:bg-[#ffe066] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {healthSubmitting ? "Submitting..." : "Proceed to Payment"}
              </button>
            </div>

            {vetsError && (
              <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {vetsError}
              </div>
            )}
            {healthNotice && !healthError && (
              <div className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                {healthNotice}
              </div>
            )}
            {healthError && (
              <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {healthError}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Select Vet</label>
                <select
                  value={selectedVetId}
                  onChange={(e) => {
                    setSelectedVetId(e.target.value);
                    if (healthError) setHealthError("");
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                  disabled={vetsLoading}
                >
                  <option value="">-- Choose a vet --</option>
                  {vets.map((v) => (
                    <option
                      key={v.vet_user_id ?? v.user_id ?? v.id}
                      value={v.vet_user_id ?? v.user_id ?? v.id}
                    >
                      {v.full_name || v.username || v.vet_profile_name || v.name || `Vet #${v.vet_user_id ?? v.user_id ?? v.id}`}
                      {v.clinic_name ? ` • ${v.clinic_name}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {currentPet ? `Current pet: ${currentPet.name || `#${currentPet.id}`}` : "Tip: select a pet in Dashboard for better context."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Upload Images (max 5)</label>
                <input
                  ref={healthFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={(e) => setHealthFiles(Array.from(e.target.files || []).slice(0, 5))}
                  className="hidden"
                  disabled={healthSubmitting}
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => healthFileInputRef.current?.click()}
                    disabled={healthSubmitting}
                    className="w-44 shrink-0 border border-slate-200 rounded-xl px-4 py-3 bg-white font-semibold text-sm text-slate-800 hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {healthFiles.length ? "Change photos" : "Add photos"}
                  </button>

                  <div
                    className="min-w-0 flex-1 text-[11px] text-slate-600 truncate"
                    title={healthFiles.length ? healthFiles.map((f) => f.name).join(", ") : "No files selected"}
                  >
                    {healthFiles.length
                      ? `${healthFiles.length} selected`
                      : "No files selected"}
                  </div>

                  {healthFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setHealthFiles([])}
                      disabled={healthSubmitting}
                      className="shrink-0 text-[11px] px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-2">Describe the problem</label>
                <textarea
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                  placeholder="e.g., loss of appetite, vomiting, scratching..."
                  disabled={healthSubmitting}
                />
              </div>
            </div>
          </div>
          {/* Footer: Emergency animal ambulance (Dhaka only) */}
          <footer className="mt-6 border-t bg-white/85 backdrop-blur-md relative z-10">
            <div className="max-w-6xl mx-auto px-6 md:px-16 py-6">
              <p className="text-slate-900 font-semibold">Dhaka’s first animal ambulance (Free service)</p>
              <p className="text-sm text-slate-600 mt-1">
                If you find any injured or accident-hit animal, call this number. They will take the animal to the hospital at no cost.
                <span className="ml-1 font-medium text-slate-700">(Service available only in Dhaka)</span>
              </p>
              <div className="mt-4">
                <a
                  href="tel:01346990244"
                  className="inline-flex items-center justify-center rounded-full px-5 py-3 bg-red-600 text-white font-semibold shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Call animal ambulance at 01346-990244"
                >
                  📞 Call: 01346-990244
                </a>
              </div>
            </div>
          </footer>
        </section>

        <main className="px-6 md:px-16 pb-8  gap-6 relative z-10 flex-1">
          {/* Left: Controls + Map */}
          <section className=" flex flex-row gap-4">
            {/* Address bar (glass card) */}
            <div className="w-1/2 min-w-[220px] flex flex-col justify-between">
              <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-5 mb-4">
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  Address (Search)
                </label>
                <input
                  ref={addressInputRef}
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Start typing your address"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                  disabled={!googleLoaded || missingKey}
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={useMyLocation}
                    className="rounded-full bg-[#0f172a] px-4 py-2 text-xs font-medium text-[#edfdfd] hover:bg-slate-900 transition"
                  >
                    Use my location
                  </button>
                  {typeof latitude === "number" && typeof longitude === "number" && (
                    <span className="text-[11px] text-slate-500">
                      Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={findVets}
                disabled={isSearching || missingKey}
                className="rounded-full bg-[#0f172a] hover:bg-slate-900 text-[#edfdfd] font-semibold px-6 py-3 shadow transition disabled:opacity-60"
              >
                {isSearching ? "Searching..." : "Find Nearby Vets"}
              </button>
              {!!errorMsg && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
                  {errorMsg}
                </div>
              )}
            </div>
            {/* Map picker card */}
            <div className="w-1/2">
              <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-5">
                <label className="block text-xs font-medium text-slate-600 mb-2">Pick on Map</label>
                <div ref={mapElRef} className="h-72 w-full rounded-2xl border border-slate-200" />
                <p className="mt-2 text-[11px] text-slate-500">
                  Click on the map or drag the marker to set your home location.
                </p>
                {missingKey && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-2xl">
                    <p className="text-sm text-slate-500">
                      Google Maps not available. Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your .env file.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right: Results */}
          <section className="lg:col-span-3">
            <div className="bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#0f172a]/70">Nearby clinics</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {results.length ? `${results.length} result(s)` : "Select location and search"}
                  </p>
                </div>
                <span className="text-[10px] bg-[#fdd142] text-black px-2 py-1 rounded-full">Live</span>
              </div>

              {!results.length ? (
                <div className="text-slate-600 text-sm">No results yet. Drop a pin or select an address, then click search.</div>
              ) : (
                <ul className="space-y-3">
                  {results.map((r, i) => (
                    <li
                      key={r.place_id || i}
                      className="bg-white border border-slate-100 rounded-2xl p-3 hover:-translate-y-0.5 hover:shadow-sm transition cursor-pointer"
                      onClick={() => focusResult(i)}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={r.photoUrl || PLACEHOLDER_IMG}
                          alt={r.name}
                          className="w-20 h-16 object-cover rounded-xl border"
                          loading="lazy"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {i + 1}. {r.name}
                              </div>
                              {typeof r.rating === "number" && (
                                <div className="text-[11px] text-slate-600">
                                  ⭐ {r.rating} ({r.userRatingsTotal || 0})
                                </div>
                              )}
                              <div className="text-sm text-slate-700 mt-1">{r.vicinity || "Address unavailable"}</div>
                              <div className="text-[11px] text-slate-500 mt-1">
                                {r.distanceKm} km away
                                {r.openingNow === true && <span className="ml-2 text-emerald-700">• Open now</span>}
                                {r.openingNow === false && <span className="ml-2 text-red-700">• Closed</span>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <a
                                className="text-[#0f172a] text-xs underline hover:no-underline"
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                  `${r.location.lat},${r.location.lng}`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Directions
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>

        

        {/* Empty-location modal */}
        {showEmptyAddressPopup && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-xl p-6 w-[90%] max-w-sm">
              <div className="text-lg font-semibold text-slate-900 mb-2">You have not selected a location</div>
              <p className="text-sm text-slate-600">
                Drop a pin on the map or search your address first.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowEmptyAddressPopup(false)}
                  className="px-4 py-2 rounded-full bg-[#0f172a] text-[#edfdfd] hover:bg-slate-900"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Keyframes to match LandingPage animations */}
        <style>{`
          @keyframes slideup {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadein {
            from { opacity: 0; }
            to { opacity: 1; }
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
          @keyframes popin {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>

      {/* Dummy payment modal */}
      {paymentOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Payment</h3>
                <p className="text-sm text-slate-600 mt-1">This is a dummy payment prompt.</p>
              </div>
              <button
                className="text-slate-500 hover:text-slate-800 text-xl"
                onClick={() => setPaymentOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Consult fee</div>
                <div className="text-sm font-bold">৳ 99</div>
              </div>
              <div className="text-[12px] text-slate-600 mt-1">No real payment is processed.</div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="px-5 py-2 rounded-xl border"
                onClick={() => setPaymentOpen(false)}
                disabled={healthSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 rounded-xl bg-[#0f172a] text-[#edfdfd] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={submitHealthCheck}
                disabled={healthSubmitting}
              >
                {healthSubmitting ? "Processing..." : "Pay & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
