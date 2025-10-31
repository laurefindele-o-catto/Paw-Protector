// profilePage.jsx
import PhotoCard from "../Components/profilePictureCard";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import apiConfig from "../config/apiConfig";
import { useNavigate } from "react-router-dom";
// Simple loader for Google Places script
function useGooglePlaces(apiKey) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps?.places) { setLoaded(true); return; }
    const id = 'gmaps-script';
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    s.async = true;
    s.onload = () => setLoaded(true);
    document.body.appendChild(s);
  }, [apiKey]);
  return loaded;
}

const placeholder = "/placeholder.png";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Phone number with region picker
  const [dialCode, setDialCode] = useState("+880"); // default BD
  const [phoneLocal, setPhoneLocal] = useState("");
  // Location fields
  const [locationId, setLocationId] = useState(null);
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [placeId, setPlaceId] = useState("");
  const [pets, setPets] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const token = localStorage.getItem('token');
  const fileInputRef = useRef();
  const addressInputRef = useRef();
  const googleLoaded = useGooglePlaces('AIzaSyDs43IZ9rUBN_E6tPSU130RGQAul0Wj2ds');
  //TODO: Hardcoded change it before submission

  // ADD: map + geocoder refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);

  // Attach Places Autocomplete (extend to sync map/marker)
  useEffect(() => {    
    if (!googleLoaded || !addressInputRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      fields: ['formatted_address', 'address_components', 'geometry', 'place_id']
    });

    ac.addListener('place_changed', () => {
      const p = ac.getPlace();
      if (!p) return;

      setAddressLine(p.formatted_address || "");
      const comps = p.address_components || [];
      const get = (type) => comps.find(c => c.types.includes(type))?.long_name || "";

      setCity(get('locality') || get('administrative_area_level_2'));
      setState(get('administrative_area_level_1'));
      setPostalCode(get('postal_code'));
      setCountry(get('country'));
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
        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
        }
      }
    });
  }, [googleLoaded]);

  const getPets = async () => {
    try {
      const response = await fetch(`${apiConfig.baseURL}/api/pets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      const result = await response.json();
      setPets(result.pets || []);
    } catch {
      setPets([]);
    }
  };

  const loadMyLocations = async () => {
    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.users.locations.listMine}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const first = data?.locations?.[0];
      if (first) {
        setLocationId(first.id);
        setAddressLine(first.address_line || "");
        setCity(first.city || "");
        setState(first.state || "");
        setPostalCode(first.postal_code || "");
        setCountry(first.country || "");
        setLatitude(first.latitude || null);
        setLongitude(first.longitude || null);
        setPlaceId(first.place_id || "");
      }
    } catch { }
  };

  // Preload user + pets + location
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u) {
        setUser(u);
        setName(u.full_name || "");
        setEmail(u.email || "");
        // Try to hydrate phone if saved like +8801xxxx
        if (u.phone_number) {
          const m = (u.phone_number || "").match(/^(\+\d{1,4})(.*)$/);
          if (m) { setDialCode(m[1]); setPhoneLocal(m[2]); }
        }
      }
    } catch { }
    getPets();
    loadMyLocations();
  }, []);

  // Handle photo click/selection
  const handlePhotoClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  // Submit profile + location
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    // build E.164
    const phone_number = (dialCode + phoneLocal).replace(/\s+/g, '');

    try {
      // 1) Update profile (JSON)
      const profileRes = await fetch(
        `${apiConfig.baseURL}${apiConfig.users.updateProfile(user.id)}`,
        {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            full_name: name,
            email,
            phone_number,
            is_active: true
          })
        }
      );
      if (!profileRes.ok) {
        const err = await profileRes.json();
        throw new Error(err?.error || "Profile update failed");
      }

      // 2) Upsert first location
      const locationBody = {
        address_line: addressLine,
        city, state, postal_code: postalCode, country,
        latitude, longitude, place_id: placeId
      };

      let locOk = true;
      if (locationId) {
        const locRes = await fetch(`${apiConfig.baseURL}${apiConfig.users.locations.update(locationId)}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(locationBody)
        });
        locOk = locRes.ok;
      } else {
        const locRes = await fetch(`${apiConfig.baseURL}${apiConfig.users.locations.create}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(locationBody)
        });
        locOk = locRes.ok;
      }
      if (!locOk) throw new Error("Failed to save location");

      // 3) Avatar (optional)
      if (selectedFile) {
        const fd = new FormData();
        fd.append("avatar", selectedFile);
        const avatarRes = await fetch(`${apiConfig.baseURL}${apiConfig.users.uploadAvatar(user.id)}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: fd
        });
        if (!avatarRes.ok) {
          const err = await avatarRes.json();
          throw new Error(err?.error || "Avatar upload failed");
        }
      }

      // Refresh local user
      const updated = await profileRes.json();
      localStorage.setItem("user", JSON.stringify(updated.user));
      alert("Profile updated!");
      window.location.reload();
    } catch (error) {
      alert(error.message || "Failed to update profile.");
    }
  };

  // ADD: init map + geocoder
  useEffect(() => {
    if (!googleLoaded || !mapContainerRef.current) return;

    if (!geocoderRef.current) geocoderRef.current = new window.google.maps.Geocoder();

    const center = {
      lat: latitude ?? 23.7808875, // Dhaka default
      lng: longitude ?? 90.2792371
    };

    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center,
      zoom: latitude && longitude ? 15 : 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    markerRef.current = new window.google.maps.Marker({
      position: center,
      map: mapRef.current,
      draggable: true
    });

    // click on map
    mapRef.current.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateFromLatLng(lat, lng);
    });

    // drag marker
    markerRef.current.addListener('dragend', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateFromLatLng(lat, lng);
    });
  }, [googleLoaded, latitude, longitude]);

  // ADD: reverse geocode helper
  const updateFromLatLng = async (lat, lng) => {
    try {
      setLatitude(lat);
      setLongitude(lng);

      if (!geocoderRef.current) return;
      const { results } = await geocoderRef.current.geocode({ location: { lat, lng } });

      if (results && results.length) {
        const best = results[0];
        setAddressLine(best.formatted_address || "");
        const comps = best.address_components || [];
        const get = (type) => comps.find(c => c.types.includes(type))?.long_name || "";

        setCity(get('locality') || get('administrative_area_level_2'));
        setState(get('administrative_area_level_1'));
        setPostalCode(get('postal_code'));
        setCountry(get('country'));
        setPlaceId(best.place_id || "");
      }

      if (markerRef.current) markerRef.current.setPosition({ lat, lng });
      if (mapRef.current) mapRef.current.setCenter({ lat, lng });
    } catch { }
  };

  // ADD: use browser geolocation
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateFromLatLng(lat, lng);
        if (mapRef.current) mapRef.current.setZoom(15);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 overflow-hidden flex flex-col items-center pt-20 px-4">
      {/* animated background shapes (LandingPage palette) */}
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

      {/* Profile avatar button */}
      <div
        className="absolute top-6 right-6 cursor-pointer"
        onClick={handlePhotoClick}
        title="Click to change photo"
      >
        <PhotoCard
          avatarUrl={selectedFile ? URL.createObjectURL(selectedFile) : (user?.avatar_url || placeholder)}
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* Heading */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 text-center mb-8 tracking-tight animate-[slideup_0.6s_ease-out]">
        Personal Information
      </h1>

      {/* Form card */}
      <form
        className="relative w-full max-w-[720px] bg-white/85 backdrop-blur-md border border-white rounded-3xl shadow-xl p-6 md:p-10 animate-[slideup_0.6s_ease-out]"
        onSubmit={handleSubmit}
      >
        {/* tiny floating accent inside card */}
        <div className="pointer-events-none absolute -top-4 -right-4 h-12 w-12 bg-[#fdd142] rounded-full opacity-70 animate-[float_6s_ease-in-out_infinite]" />

        {/* Full name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
            placeholder="Enter Full Name"
          />
        </div>

        {/* Email */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
            placeholder="Enter Email"
          />
        </div>

        {/* Phone with region picker */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Contact (Phone)
          </label>
          <div className="flex gap-2">
            <select
              value={dialCode}
              onChange={(e) => setDialCode(e.target.value)}
              className="w-28 px-3 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
              title="Country code"
            >
              <option value="+880">+880 (BD)</option>
              <option value="+91">+91 (IN)</option>
              <option value="+1">+1 (US)</option>
              <option value="+44">+44 (UK)</option>
            </select>
            <input
              type="tel"
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
              placeholder="1XXXXXXXXX"
            />
          </div>
        </div>

        {/* Address with Google Places */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Address (Search)
          </label>
          <input
            ref={addressInputRef}
            type="text"
            value={addressLine}
            onChange={(e)=>setAddressLine(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/30 focus:border-[#0f172a] transition"
            placeholder="Start typing your address"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={useMyLocation}
              className="rounded-full bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-[#edfdfd] hover:bg-slate-900 transition"
            >
              Use my location
            </button>
            {typeof latitude === "number" && typeof longitude === "number" && (
              <span className="text-xs text-slate-500">
                Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
              </span>
            )}
          </div>
        </div>

        {/* Map picker */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Pick on Map
          </label>
          <div
            ref={mapContainerRef}
            className="h-64 w-full rounded-2xl border border-slate-200"
          />
          <p className="mt-2 text-xs text-slate-500">
            Click on the map or drag the marker to refine your location.
          </p>
        </div>

        {/* Location details */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
            <input value={city} onChange={e=>setCity(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/20 focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
            <input value={state} onChange={e=>setState(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/20 focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Postal Code</label>
            <input value={postalCode} onChange={e=>setPostalCode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/20 focus:border-[#0f172a]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
            <input value={country} onChange={e=>setCountry(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:ring-4 focus:ring-[#fdd142]/20 focus:border-[#0f172a]" />
          </div>
        </div>

        <button
          type="submit"
          className="mt-8 self-end px-6 py-3 text-sm rounded-full bg-[#0f172a] text-[#edfdfd] font-semibold shadow hover:bg-slate-900 transition transform hover:-translate-y-[1px]"
        >
          Save
        </button>
      </form>

      {/* Pets Section */}
      <div className="w-full max-w-[720px] mt-14 border-t border-slate-200 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#edfdfd] font-bold text-xs">
            PP
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Your Pets</h2>
        </div>

        {pets.length === 0 ? (
          <div className="text-slate-500 text-center py-8">Currently no pets added.</div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
            {pets.map((pet, idx) => (
              <div key={pet.id || idx}>
                <PhotoCard
                  name={pet.name}
                  avatarUrl={pet.avatar_url || "/placeholder.png"}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Link to="/addPet" className="fixed bottom-8 right-8">
        <button
          className="w-16 h-16 rounded-full bg-[#0f172a] text-[#edfdfd] shadow-lg transition-transform duration-200 hover:scale-110 hover:shadow-2xl"
          aria-label="Add Pet"
        >
          <span className="text-3xl font-bold">+</span>
        </button>
      </Link>

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

export default ProfilePage;
