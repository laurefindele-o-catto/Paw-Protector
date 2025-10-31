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
    <div className="bg-linear-to-br from-[#FFFDF6] to-[#f9fafb] min-h-screen flex flex-col items-center pt-16 px-4">
      <button
        
        onClick={() => navigate("/dashboard")}
        className="absolute top-6 left-6 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition z-20"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </button>
      <div
        className="absolute top-6 right-6 animate-fade-in cursor-pointer"
        onClick={handlePhotoClick}
        title="Click to change photo"
      >
        <PhotoCard avatarUrl={selectedFile ? URL.createObjectURL(selectedFile) : (user?.avatar_url || placeholder)} />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      <h1 className="text-5xl font-extrabold text-gray-800 text-center font-sans mb-10 tracking-tight animate-fade-in">
        Personal Information
      </h1>

      <form
        className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg flex flex-col gap-6 border border-gray-100 animate-slide-up"
        onSubmit={handleSubmit}
      >
        {/* Full name */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            placeholder="Enter Full Name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            placeholder="Enter Email"
          />
        </div>

        {/* Phone with region picker */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Contact (Phone)
          </label>
          <div className="flex gap-2">
            <select
              value={dialCode}
              onChange={(e) => setDialCode(e.target.value)}
              className="w-28 border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="1XXXXXXXXX"
            />
          </div>
        </div>

        {/* Address with Google Places */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Address (Search)
          </label>
          <input
            ref={addressInputRef}
            type="text"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Start typing your address"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={useMyLocation}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Use my location
            </button>
            {typeof latitude === "number" && typeof longitude === "number" && (
              <span className="text-xs text-gray-500">
                Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
              </span>
            )}
          </div>
        </div>

        {/* Map picker */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Pick on Map
          </label>
          <div
            ref={mapContainerRef}
            className="h-64 w-full rounded-lg border border-gray-200"
          />
          <p className="mt-2 text-xs text-gray-500">
            Click on the map or drag the marker to refine your location.
          </p>
        </div>

        {/* Location details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">City</label>
            <input value={city} onChange={e => setCity(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">State</label>
            <input value={state} onChange={e => setState(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Postal Code</label>
            <input value={postalCode} onChange={e => setPostalCode(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Country</label>
            <input value={country} onChange={e => setCountry(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3" />
          </div>
        </div>

        <button
          type="submit"
          className="self-end px-6 py-3 text-sm rounded bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition"
        >
          Save
        </button>
      </form>

      {/* Pets Section (unchanged) */}
      <div className="w-full max-w-lg mt-14 border-t border-gray-200 pt-8">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800 font-sans animate-fade-in">
          Your Pets
        </h2>
        {pets.length === 0 ? (
          <div className="text-gray-500 text-center py-8">Currently no pets added.</div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
            {pets.map((pet, idx) => (
              <div key={pet.id || idx} className={`animate-fade-in delay-${100 * (idx + 1)}`}>
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
      <Link to="/addPet">
        <button
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-lg transition-transform duration-200 hover:scale-110 hover:shadow-2xl"
          style={{ backgroundColor: "#B6CEB4" }}
          aria-label="Add Pet"
        >
          <span className="text-white text-3xl font-bold">+</span>
        </button>
      </Link>
    </div>
  );
}

export default ProfilePage;
