import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import VetHeader from '../components/VetHeader';
import apiConfig from '../config/apiConfig';

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



export default function VetProfile() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const token = localStorage.getItem('token');

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.replace(/"/g, "");
  const showMaps = !!googleMapsApiKey;
  const googleLoaded = useGooglePlaces(showMaps ? googleMapsApiKey : null);

  // Tabs
  const [tab, setTab] = useState('vet'); // 'vet' | 'clinic'

  // Vet form
  const [vetName, setVetName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseIssuer, setLicenseIssuer] = useState('');
  const [licenseValidUntil, setLicenseValidUntil] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [clinicId, setClinicId] = useState('');

  // Clinic form
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');

  // Vet location state/refs
  const [vetAddress, setVetAddress] = useState('');
  const [vetLat, setVetLat] = useState(null);
  const [vetLng, setVetLng] = useState(null);
  const vetAddressInputRef = useRef(null);
  const vetMapContainerRef = useRef(null);
  const vetMapRef = useRef(null);
  const vetMarkerRef = useRef(null);
  const vetGeocoderRef = useRef(null);

  // Clinic location state/refs
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicLat, setClinicLat] = useState(null);
  const [clinicLng, setClinicLng] = useState(null);
  const clinicAddressInputRef = useRef(null);
  const clinicMapContainerRef = useRef(null);
  const clinicMapRef = useRef(null);
  const clinicMarkerRef = useRef(null);
  const clinicGeocoderRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  // Load vet profile from API
  const loadVetProfile = async () => {
    if (!user?.id || !token) return;
    try {
      const res = await fetch(
        `${apiConfig.baseURL}${apiConfig.clinics.getVet(user.id)}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.ok) {
        const data = await res.json();
        const vet = data?.vet || data?.data || {};

        setVetName(
          vet.name ||
          user?.full_name ||
          user?.username ||
          ''
        );
        setLicenseNumber(vet.license_number || '');
        setLicenseIssuer(vet.license_issuer || '');
        setLicenseValidUntil(vet.license_valid_until || '');
        setSpecialization(vet.specialization || '');
        setClinicId(vet.clinic_id ? String(vet.clinic_id) : '');
        setVetAddress(vet.address || '');
        setVetLat(vet.latitude ?? null);
        setVetLng(vet.longitude ?? null);

        if (vet.clinic) {
          setClinicName(vet.clinic.name || '');
          setClinicPhone(vet.clinic.phone || '');
          setClinicEmail(vet.clinic.email || '');
          setClinicAddress(vet.clinic.address || '');
          setClinicLat(vet.clinic.latitude ?? null);
          setClinicLng(vet.clinic.longitude ?? null);
        }
      }
    } catch (e) {
      console.log('Could not load vet profile from API');
      // Fallback to localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('vet_profile') || 'null');
        if (saved && typeof saved === 'object') {
          setVetName(saved.name || '');
          setLicenseNumber(saved.license_number || '');
          setLicenseIssuer(saved.license_issuer || '');
          setLicenseValidUntil(saved.license_valid_until || '');
          setSpecialization(saved.specialization || '');
          setClinicId(saved.clinic_id ? String(saved.clinic_id) : '');
          setVetAddress(saved.address || '');
          setVetLat(saved.latitude ?? null);
          setVetLng(saved.longitude ?? null);
          if (saved.clinic) {
            setClinicName(saved.clinic.name || '');
            setClinicPhone(saved.clinic.phone || '');
            setClinicEmail(saved.clinic.email || '');
            setClinicAddress(saved.clinic.address || '');
            setClinicLat(saved.clinic.latitude ?? null);
            setClinicLng(saved.clinic.longitude ?? null);
          }
        }
      } catch { }
    }
  };

  //auto load vet profile
  useEffect(() => {
    if (user?.id) {
      loadVetProfile();
    } else if (user) {
      setVetName(user.full_name || user.username || '');
    }
  }, [user]);


  // Vet autocomplete/map
  useEffect(() => {
    if (!googleLoaded || tab !== 'vet' || !vetAddressInputRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(vetAddressInputRef.current, {
      fields: ['formatted_address', 'geometry', 'place_id']
    });
    ac.addListener('place_changed', () => {
      const p = ac.getPlace();
      if (!p) return;
      setVetAddress(p.formatted_address || '');
      if (p.geometry?.location) {
        const lat = p.geometry.location.lat();
        const lng = p.geometry.location.lng();
        setVetLat(lat);
        setVetLng(lng);
        if (vetMapRef.current) {
          vetMapRef.current.setCenter({ lat, lng });
          vetMapRef.current.setZoom(15);
        }
        if (vetMarkerRef.current) vetMarkerRef.current.setPosition({ lat, lng });
      }
    });
  }, [googleLoaded, tab]);


  useEffect(() => {
    if (!googleLoaded || tab !== 'vet' || !vetMapContainerRef.current) return;
    if (vetMapRef.current) return;
    if (!vetGeocoderRef.current) vetGeocoderRef.current = new window.google.maps.Geocoder();

    const center = {
      lat: vetLat ?? 23.7808875,
      lng: vetLng ?? 90.2792371
    };
    vetMapRef.current = new window.google.maps.Map(vetMapContainerRef.current, {
      center,
      zoom: typeof vetLat === 'number' && typeof vetLng === 'number' ? 15 : 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    vetMarkerRef.current = new window.google.maps.Marker({
      position: center,
      map: vetMapRef.current,
      draggable: true
    });
    vetMapRef.current.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateVetLatLng(lat, lng);
    });
    vetMarkerRef.current.addListener('dragend', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateVetLatLng(lat, lng);
    });
  }, [googleLoaded, tab]);

  const updateVetLatLng = async (lat, lng) => {
    try {
      setVetLat(lat);
      setVetLng(lng);
      if (!vetGeocoderRef.current) return;
      const { results } = await vetGeocoderRef.current.geocode({ location: { lat, lng } });
      if (results && results.length) {
        setVetAddress(results[0].formatted_address || '');
      }
      if (vetMarkerRef.current) vetMarkerRef.current.setPosition({ lat, lng });
      if (vetMapRef.current) vetMapRef.current.setCenter({ lat, lng });
    } catch { }
  };

  const useMyVetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateVetLatLng(lat, lng);
        if (vetMapRef.current) vetMapRef.current.setZoom(15);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Clinic autocomplete/map
  useEffect(() => {
    if (!googleLoaded || tab !== 'clinic' || !clinicAddressInputRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(clinicAddressInputRef.current, {
      fields: ['formatted_address', 'geometry', 'place_id']
    });
    ac.addListener('place_changed', () => {
      const p = ac.getPlace();
      if (!p) return;
      setClinicAddress(p.formatted_address || '');
      if (p.geometry?.location) {
        const lat = p.geometry.location.lat();
        const lng = p.geometry.location.lng();
        setClinicLat(lat);
        setClinicLng(lng);
        if (clinicMapRef.current) {
          clinicMapRef.current.setCenter({ lat, lng });
          clinicMapRef.current.setZoom(15);
        }
        if (clinicMarkerRef.current) clinicMarkerRef.current.setPosition({ lat, lng });
      }
    });
  }, [googleLoaded, tab]);

  useEffect(() => {
    if (!googleLoaded || tab !== 'clinic' || !clinicMapContainerRef.current) return;
    if (clinicMapRef.current) return;
    if (!clinicGeocoderRef.current) clinicGeocoderRef.current = new window.google.maps.Geocoder();
    const center = {
      lat: clinicLat ?? 23.7808875,
      lng: clinicLng ?? 90.2792371
    };
    clinicMapRef.current = new window.google.maps.Map(clinicMapContainerRef.current, {
      center,
      zoom: typeof clinicLat === 'number' && typeof clinicLng === 'number' ? 15 : 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    clinicMarkerRef.current = new window.google.maps.Marker({
      position: center,
      map: clinicMapRef.current,
      draggable: true
    });
    clinicMapRef.current.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateClinicLatLng(lat, lng);
    });
    clinicMarkerRef.current.addListener('dragend', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateClinicLatLng(lat, lng);
    });
  }, [googleLoaded, tab]);

  const updateClinicLatLng = async (lat, lng) => {
    try {
      setClinicLat(lat);
      setClinicLng(lng);
      if (!clinicGeocoderRef.current) return;
      const { results } = await clinicGeocoderRef.current.geocode({ location: { lat, lng } });
      if (results && results.length) {
        setClinicAddress(results[0].formatted_address || '');
      }
      if (clinicMarkerRef.current) clinicMarkerRef.current.setPosition({ lat, lng });
      if (clinicMapRef.current) clinicMapRef.current.setCenter({ lat, lng });
    } catch { }
  };

  const useMyClinicLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateClinicLatLng(lat, lng);
        if (clinicMapRef.current) clinicMapRef.current.setZoom(15);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Submit handlers
  const saveVet = async () => {
    if (!user?.id) return;
    console.log('saveVet: token=', token, 'user.id=', user?.id);
    if (!token) { alert('No token found'); return; }
    try {
      const body = {
        name: vetName || user?.full_name || user?.username || 'Vet',
        clinic_id: clinicId ? Number(clinicId) : undefined,
        license_number: licenseNumber || undefined,
        license_issuer: licenseIssuer || undefined,
        license_valid_until: licenseValidUntil || undefined,
        specialization: specialization || undefined,
        address: vetAddress || undefined,
        latitude: vetLat ?? undefined,
        longitude: vetLng ?? undefined,
      };
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.clinics.updateVet(user.id)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      console.log('saveVet: response status=', res.status);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update vet');

      // Persist to localStorage
      try {
        localStorage.setItem('vet_profile', JSON.stringify({
          name: vetName,
          license_number: licenseNumber,
          license_issuer: licenseIssuer,
          license_valid_until: licenseValidUntil,
          specialization: specialization,
          clinic_id: clinicId ? Number(clinicId) : null,
          address: vetAddress,
          latitude: vetLat ?? null,
          longitude: vetLng ?? null,
          clinic: {
            name: clinicName,
            phone: clinicPhone,
            email: clinicEmail,
            address: clinicAddress,
            latitude: clinicLat ?? null,
            longitude: clinicLng ?? null
          }
        }));
      } catch { }

      alert('Vet profile saved');
    } catch (e) {
      alert(e.message || 'Failed to save vet');
    }
  };

  const saveClinic = async () => {
    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.clinics.createClinic}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clinicName,
          phone: clinicPhone || null,
          email: clinicEmail || null,
          address: clinicAddress || null,
          latitude: clinicLat ?? null,
          longitude: clinicLng ?? null,
          hours: null,
          is_verified: false
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to add clinic');
      setClinicId(String(data?.clinic?.id || ''));
      alert('Clinic saved. Linked to your vet profile.');
    } catch (e) {
      alert(e.message || 'Failed to add clinic');
    }
  };

  return (
    <>
      <VetHeader />
      <div className="relative min-h-screen bg-[#edfdfd] text-slate-900 pt-24 px-4">
        <div className="mx-auto max-w-3xl bg-white/90 backdrop-blur-md border border-white rounded-3xl shadow-lg p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Vet Profile</h1>
            <button
              onClick={() => navigate('/vdashboard')}
              className="px-3 py-2 rounded-lg bg-[#0f172a] text-white text-sm"
            >
              Back
            </button>
          </div>

          {/* Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab('vet')}
              className={`px-4 py-2 rounded-xl text-sm ${tab === 'vet' ? 'bg-[#0f172a] text-white' : 'bg-slate-100'}`}
            >
              Vet info
            </button>
            <button
              onClick={() => setTab('clinic')}
              className={`px-4 py-2 rounded-xl text-sm ${tab === 'clinic' ? 'bg-[#0f172a] text-white' : 'bg-slate-100'}`}
            >
              Clinic info
            </button>
          </div>

          {/* Forms */}
          {tab === 'vet' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full name</label>
                <input className="w-full mt-1 border rounded-xl px-3 py-2" value={vetName}
                  onChange={(e) => setVetName(e.target.value)} placeholder="Dr. Jane Doe" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">License number</label>
                  <input className="w-full mt-1 border rounded-xl px-3 py-2" value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g., BVC-12345" />
                </div>
                <div>
                  <label className="text-sm font-medium">License issuer</label>
                  <input className="w-full mt-1 border rounded-xl px-3 py-2" value={licenseIssuer}
                    onChange={(e) => setLicenseIssuer(e.target.value)} placeholder="e.g., Bangladesh Veterinary Council" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">License valid until</label>
                  <input type="date" className="w-full mt-1 border rounded-xl px-3 py-2"
                    value={licenseValidUntil} onChange={(e) => setLicenseValidUntil(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Specialization</label>
                  <input className="w-full mt-1 border rounded-xl px-3 py-2" value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)} placeholder="Dermatology, Internal Med, ..." />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Clinic ID (optional)</label>
                <input className="w-full mt-1 border rounded-xl px-3 py-2" value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)} placeholder="Link to an existing clinic ID" />
                <p className="text-[11px] text-slate-500 mt-1">
                  If empty, a default “Home Practice” clinic will be created with the location below.
                </p>
              </div>

              {/* Location for default clinic */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Practice location (for home visits or default clinic)</label>
                <input
                  ref={vetAddressInputRef}
                  className="w-full border rounded-xl px-3 py-2"
                  value={vetAddress}
                  onChange={(e) => setVetAddress(e.target.value)}
                  placeholder="Search address"
                  disabled={!showMaps}
                />
                <div className="mt-3 flex items-center gap-3">
                  <button onClick={useMyVetLocation} type="button"
                    className="rounded-full bg-[#0f172a] px-4 py-2 text-sm text-white"
                    disabled={!showMaps}
                  >
                    Use my location
                  </button>
                  {typeof vetLat === 'number' && typeof vetLng === 'number' && showMaps && (
                    <span className="text-xs text-slate-500">
                      Lat: {vetLat.toFixed(5)}, Lng: {vetLng.toFixed(5)}
                    </span>
                  )}
                </div>
                {showMaps ? (
                  <div ref={vetMapContainerRef} className="mt-3 h-64 w-full rounded-2xl border" />
                ) : (
                  <div className="mt-3 h-64 w-full rounded-2xl border flex items-center justify-center bg-slate-50 text-slate-500">
                    Map unavailable. Add your Google Maps API key to enable this feature.
                  </div>
                )}
                {!showMaps && (
                  <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                    Google Maps API key not found. Please set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your .env file to enable address search and map features.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button onClick={saveVet}
                  className="px-5 py-3 rounded-full bg-[#0f172a] text-white font-semibold">
                  Save vet info
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Clinic name</label>
                <input className="w-full mt-1 border rounded-xl px-3 py-2" value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)} placeholder="Happy Paws Clinic" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <input className="w-full mt-1 border rounded-xl px-3 py-2" value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)} placeholder="+8801XXXXXXXXX" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="w-full mt-1 border rounded-xl px-3 py-2" value={clinicEmail}
                    onChange={(e) => setClinicEmail(e.target.value)} placeholder="clinic@example.com" />
                </div>
              </div>

              {/* Location for clinic */}
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Clinic address</label>
                <input
                  ref={clinicAddressInputRef}
                  className="w-full border rounded-xl px-3 py-2"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="Search address"
                  disabled={!showMaps}
                />
                <div className="mt-3 flex items-center gap-3">
                  <button onClick={useMyClinicLocation} type="button"
                    className="rounded-full bg-[#0f172a] px-4 py-2 text-sm text-white"
                    disabled={!showMaps}
                  >
                    Use my location
                  </button>
                  {typeof clinicLat === 'number' && typeof clinicLng === 'number' && showMaps && (
                    <span className="text-xs text-slate-500">
                      Lat: {clinicLat.toFixed(5)}, Lng: {clinicLng.toFixed(5)}
                    </span>
                  )}
                </div>
                {showMaps ? (
                  <div ref={clinicMapContainerRef} className="mt-3 h-64 w-full rounded-2xl border" />
                ) : (
                  <div className="mt-3 h-64 w-full rounded-2xl border flex items-center justify-center bg-slate-50 text-slate-500">
                    Map unavailable. Add your Google Maps API key to enable this feature.
                  </div>
                )}
                {!showMaps && (
                  <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                    Google Maps API key not found. Please set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your .env file to enable address search and map features.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button onClick={saveClinic}
                  className="px-5 py-3 rounded-full bg-[#0f172a] text-white font-semibold">
                  Save clinic
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}