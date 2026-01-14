import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useLanguage } from "../context/LanguageContext";
// import Footer from "../Components/Footer";
import apiConfig from "../config/apiConfig";
import { useAuth } from "../context/AuthContext";
import { usePet } from "../context/PetContext";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import Footer from "../components/Footer";

function useGeo() {
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setPos(null),
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
    );
  }, []);
  return pos;
}

function sanitizeChat(md) {
  return md
    .replace(/[*_`>#]+/g, '') // Remove markdown symbols: *, _, `, >, #
    // .replace(/^\s*-\s*/gm, '• ') // Replace markdown list dash with bullet
    // .replace(/\n{2,}/g, '\n') // Collapse multiple blank lines
    .replace(/ +/g, ' ') // Collapse multiple spaces
    .replace(/^\s+|\s+$/g, '') // Trim leading/trailing spaces
    // .replace(/^\s*\n/gm, '') // Remove leading blank lines
    // .replace(/(\d+)\s*কিমি/g, '$1 কিমি') // Normalize km spacing
    // .replace(/Vet Name:/g, 'ভেটের নাম:') // Optional: translate field labels
    // .replace(/Clinic Name:/g, 'ক্লিনিক:') // Optional
    // .replace(/Specialization:/g, 'বিশেষজ্ঞতা:') // Optional
    // .replace(/Phone:/g, 'ফোন:') // Optional
    // .replace(/Address:/g, 'ঠিকানা:') // Optional
    // .replace(/Distance:/g, 'দূরত্ব:'); // Optional
}

const HF_ENDPOINT = "https://pritombiswas9999-disease-classifier.hf.space/predict";

export default function AssistantChat() {
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const { selectedPet } = usePet?.() || {};
  const geo = useGeo();
  const { t, currentLanguage } = useLanguage();

  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]); // [{id,title,pet_id,updated_at}]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);
  const fileRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [pendingVision, setPendingVision] = useState(null); // { name, dataUrl }
  const [isVoiceMessage, setIsVoiceMessage] = useState(false); // Track if message was sent via voice

  // Voice features - with auto-send on transcript completion
  const speechLang = currentLanguage === 'bn' ? 'bn-BD' : 'en-US';
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: speechLang,
    continuous: false, // Single-shot mode for better control
  });

  const { speak } = useSpeechSynthesis({
    lang: speechLang,
  });

  // Auto-send voice message when transcript is finalized
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setInput(transcript);
      // Auto-send after a brief delay to allow user to see the transcript
      const timer = setTimeout(() => {
        if (transcript.trim() && sessionId && token) {
          sendVoiceMessage(transcript.trim());
          resetTranscript();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [transcript]);

  // Send voice message function
  const sendVoiceMessage = async (voiceText) => {
    if (!voiceText || !token || !sessionId) return;
    
    setIsVoiceMessage(true); // Mark as voice message
    const userMsg = { role: "user", content: voiceText, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); // Clear input after sending
    setLoading(true);
    
    try {
      const body = {
        session_id: sessionId,
        content: voiceText,
        pet_id: petId,
        doc_types: "pet_summary,metric,disease,vaccination,deworming,vision,chat",
        topK: 6,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null
      };
      
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.chat.agent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      const answer = data?.answer || "দুঃখিত, এখন উত্তর দিতে পারলাম না। একটু পরে আবার চেষ্টা করুন।";
      const asst = { role: "assistant", content: answer, ts: new Date().toISOString() };
      setMessages(prev => [...prev, asst]);
      
      // Read AI response aloud after voice input
      setTimeout(() => {
        const cleanAnswer = sanitizeChat(answer);
        speak(cleanAnswer);
        setIsVoiceMessage(false);
      }, 500);
    } catch {
      const errorMsg = "নেটওয়ার্ক সমস্যার কারণে এখন সম্ভব হচ্ছে না। একটু পরে চেষ্টা করুন।";
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: errorMsg, 
        ts: new Date().toISOString() 
      }]);
      
      // Read error message aloud
      setTimeout(() => {
        speak(errorMsg);
        setIsVoiceMessage(false);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  // Helpers: localStorage keys
  const userKey = user?.id || "me";
  const petId = useMemo(() => {
    if (selectedPet?.id) return selectedPet.id;
    const ls = localStorage.getItem("current_pet_id");
    return ls ? Number(ls) : null;
  }, [selectedPet?.id]);
  const sessionLSKey = useMemo(() => `chat_session_${userKey}_${petId ?? "na"}`, [userKey, petId]);
  const lsSessionsKey = useMemo(() => `chat_sessions_user_${userKey}`, [userKey]);
  const historyKey = (sid) => `chat_history_${sid}`;
  const pendingVisionKey = (sid) => `chat_pending_vision_${sid}`;

  // Local storage helpers
  const loadSessionsLS = () => {
    try { return JSON.parse(localStorage.getItem(lsSessionsKey) || "[]"); } catch { return []; }
  };
  const saveSessionsLS = (arr) => localStorage.setItem(lsSessionsKey, JSON.stringify(arr || []));
  const loadHistoryLS = (sid) => {
    try { return JSON.parse(localStorage.getItem(historyKey(sid)) || "[]"); } catch { return []; }
  };
  const saveHistoryLS = (sid, msgs) => localStorage.setItem(historyKey(sid), JSON.stringify(msgs || []));
  const loadPendingVisionLS = (sid) => {
    try { return JSON.parse(localStorage.getItem(pendingVisionKey(sid)) || "null"); } catch { return null; }
  };
  const savePendingVisionLS = (sid, v) => {
    if (!sid) return;
    if (v) localStorage.setItem(pendingVisionKey(sid), JSON.stringify(v));
    else localStorage.removeItem(pendingVisionKey(sid));
  };

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  // bootstrap: ensure session, seed sidebar list
  useEffect(() => {
    if (!token || !user) return;
    const boot = async () => {
      // load existing sessions for sidebar
      setSessions(loadSessionsLS());

      const existing = localStorage.getItem(sessionLSKey);
      if (existing && /^\d+$/.test(existing)) {
        const sid = Number(existing);
        setSessionId(sid);
        // load LS history immediately
        setMessages(loadHistoryLS(sid));
        return;
      }
      if (existing) localStorage.removeItem(sessionLSKey);

      // create server session
      try {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.chat.createSession}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ pet_id: petId, title: "Pet Assistant Chat" })
        });
        if (!res.ok) throw new Error("Failed to create session");
        const data = await res.json();
        const sid = data?.session?.id;
        const title = data?.session?.title || "Chat";
        if (sid && Number.isInteger(Number(sid))) {
          localStorage.setItem(sessionLSKey, String(sid));
          setSessionId(Number(sid));
          // add to sessions list if not present
          const next = loadSessionsLS();
          if (!next.find(s => s.id === Number(sid))) {
            next.unshift({ id: Number(sid), title, pet_id: petId ?? null, updated_at: new Date().toISOString() });
            setSessions(next);
            saveSessionsLS(next);
          }
          setMessages(loadHistoryLS(Number(sid)));
          // load pending photo (if any) for this session
          const pv = loadPendingVisionLS(Number(sid));
          if (pv) setPendingVision(pv);
        }
      } catch {
        // ignore; user can retry
      }
    };
    boot();
  }, [token, user, petId, sessionLSKey, lsSessionsKey]);

  // fetch server history and merge into LS (preserve order)
  useEffect(() => {
    if (!token || !sessionId) return;
    (async () => {
      try {
        const res = await fetch(`${apiConfig.baseURL}${apiConfig.chat.listMessages(encodeURIComponent(sessionId))}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const serverMsgs = (data?.messages || []).map(m => ({
          role: m.sender === "assistant" ? "assistant" : (m.sender === "system" ? "system" : "user"),
          content: m.content,
          ts: m.created_at || null
        }));
        const localMsgs = loadHistoryLS(sessionId);
        // simple merge: prefer local order, append any new server msgs not present by content+role+ts
        const combined = [...localMsgs];
        serverMsgs.forEach(sm => {
          const dup = combined.find(x => x.role === sm.role && x.content === sm.content && (x.ts || '') === (sm.ts || ''));
          if (!dup) combined.push(sm);
        });
        combined.sort((a,b) => (new Date(a.ts||0)) - (new Date(b.ts||0)));
        setMessages(combined);
        saveHistoryLS(sessionId, combined);
      } catch {}
    })();
  }, [token, sessionId]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // session switching
  const switchSession = (sid) => {
    if (!sid) return;
    setSessionId(sid);
    localStorage.setItem(sessionLSKey, String(sid));
    setMessages(loadHistoryLS(sid));
    setPendingVision(loadPendingVisionLS(sid));
  };

  const createNewSession = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiConfig.baseURL}${apiConfig.chat.createSession}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pet_id: petId, title: "New Chat" })
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const sid = Number(data?.session?.id);
      const title = data?.session?.title || "New Chat";
      if (!Number.isInteger(sid)) throw new Error("Invalid id");
      // add to sidebar
      const next = [{ id: sid, title, pet_id: petId ?? null, updated_at: new Date().toISOString() }, ...loadSessionsLS().filter(s => s.id !== sid)];
      setSessions(next);
      saveSessionsLS(next);
      // switch to it
      switchSession(sid);
      saveHistoryLS(sid, []);
    } catch {}
  };

  // persist to LS whenever messages change
  useEffect(() => {
    if (sessionId) saveHistoryLS(sessionId, messages);
  }, [messages, sessionId]);

  // persist pending vision per-session
  useEffect(() => {
    if (sessionId) savePendingVisionLS(sessionId, pendingVision);
  }, [pendingVision, sessionId]);

  async function dataUrlToFile(dataUrl, filename = 'photo.jpg') {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || !token || !sessionId) return;
    
    // Capture the current pending vision image before clearing state
    const currentVision = pendingVision;
    
    setInput("");
    setPendingVision(null); // Instant clear of preview for better UX
    savePendingVisionLS(sessionId, null);

    const userMsg = { role: "user", content, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    
    try {
      let res;
      if (currentVision?.dataUrl) {
        setUploading(true);
        try {
          const file = await dataUrlToFile(currentVision.dataUrl, currentVision.name || 'photo.jpg');
          const form = new FormData();
          form.append("session_id", String(sessionId));
          form.append("content", content);
          if (petId != null) form.append("pet_id", String(petId));
          form.append("doc_types", "pet_summary,metric,disease,vaccination,deworming,vision,chat");
          form.append("topK", String(6));
          if (geo?.lat != null) form.append("lat", String(geo.lat));
          if (geo?.lng != null) form.append("lng", String(geo.lng));
          form.append("file", file); // key must be 'file' to match multer
          res = await fetch(`${apiConfig.baseURL}${apiConfig.chat.agent}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }, // do NOT set Content-Type; browser will set boundary
            body: form
          });
        } finally {
          setUploading(false);
        }
      } else {
        const body = {
          session_id: sessionId,
          content,
          pet_id: petId,
          doc_types: "pet_summary,metric,disease,vaccination,deworming,vision,chat",
          topK: 6,
          lat: geo?.lat ?? null,
          lng: geo?.lng ?? null
        };
        res = await fetch(`${apiConfig.baseURL}${apiConfig.chat.agent}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        });
      }
        const data = await res.json();
        const answer = data?.answer || "দুঃখিত, এখন উত্তর দিতে পারলাম না। একটু পরে আবার চেষ্টা করুন।";
        const asst = { role: "assistant", content: answer, ts: new Date().toISOString() };
        setMessages(prev => [...prev, asst]);
        // Pending vision already cleared
      } catch {
        setMessages(prev => [...prev, { role: "assistant", content: "নেটওয়ার্ক সমস্যার কারণে এখন সম্ভব হচ্ছে না। একটু পরে চেষ্টা করুন।", ts: new Date().toISOString() }]);
      } finally {
        setLoading(false);
      }
    }

  // Inline skin disease detection
  const onPickFile = () => fileRef.current?.click();
  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !token || !sessionId) return;
    try {
      // Persist locally only; defer analysis to sendMessage()
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const pv = { name: f.name, dataUrl };
        setPendingVision(pv);
        if (sessionId) savePendingVisionLS(sessionId, pv);
      };
      reader.readAsDataURL(f);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[#edfdfd] text-slate-900 pt-12 mt-24" role="main" tabIndex="-1">
        <div className="mx-auto w-[92%] px-4 flex h-[80vh] gap-3">
          {/* Collapsible Sidebar */}
          <aside
            className={`transition-all duration-300 ease-in-out
              ${sidebarOpen ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden"}
              bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col`}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <span className="font-bold text-slate-800">History</span>
              <button
                onClick={createNewSession}
                className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-full hover:bg-slate-700 transition"
              >
                + New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {sessions.length === 0 && (
                <div className="text-slate-400 text-sm p-4 text-center italic">No chat history.</div>
              )}
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={`w-full text-left px-3 py-3 mb-1 rounded-xl transition-colors border
                    ${sessionId === s.id 
                      ? 'bg-yellow-50 border-yellow-200 shadow-sm' 
                      : 'border-transparent hover:bg-slate-50'}`}
                >
                  <div className={`text-sm font-semibold truncate ${sessionId === s.id ? 'text-slate-900' : 'text-slate-700'}`}>
                    {s.title || `Chat ${s.id}`}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>{s.pet_id ? `Pet ${s.pet_id}` : 'General'}</span>
                    <span className="opacity-60">#{s.id}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Sidebar Toggle Button (Integrated into Helper Strip) */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="h-12 w-6 bg-white border border-slate-200 shadow-sm rounded-lg flex items-center justify-center text-slate-400 hover:text-[#fdd142] hover:bg-slate-50 transition-all focus:outline-none"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? "‹" : "›"}
            </button>
          </div>

          {/* Chat panel */}
          <section className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden" aria-label="Chat conversation">
            <div 
              ref={listRef} 
              className="flex-1 overflow-y-scroll p-6 space-y-4 custom-scrollbar"
              role="log"
              aria-live="polite"
              aria-atomic="false"
              aria-relevant="additions"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <div className="text-4xl mb-4">🐾</div>
                  <p className="text-lg font-medium text-slate-600 mb-2">How can I help your pet today?</p>
                  <p className="text-sm max-w-md">Ask about health issues, vaccinations, find nearby vets, or upload a photo for analysis.</p>
                </div>
              )}
              {messages.map((m, idx) => {
                const hasVetFinderAction = m.role === "assistant" && m.content.includes("[ACTION:SHOW_VET_FINDER]");
                const displayContent = hasVetFinderAction 
                  ? m.content.replace("[ACTION:SHOW_VET_FINDER]", "").trim()
                  : m.content;
                
                return (
                  <div key={idx} className={`w-full flex ${m.role === "user" ? "justify-end" : "justify-start animate-fade-in-up"}`}>
                    <div className={`${
                      m.role === "user" 
                        ? "bg-[#fdd142] text-slate-900 rounded-tr-none" 
                        : "bg-[#f8fafc] text-slate-800 border border-slate-100 rounded-tl-none"
                      } max-w-[85%] rounded-2xl px-5 py-3 shadow-sm`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{sanitizeChat(displayContent)}</div>
                      {hasVetFinderAction && (
                        <button
                          onClick={() => navigate('/find-a-vet', { state: { lat: geo?.lat, lng: geo?.lng, fromChat: true } })}
                          className="mt-4 w-full bg-[#0f172a] hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                          aria-label="Navigate to vet finder page"
                        >
                          <span>🏥</span>
                          <span>Find Nearby Vets</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {(loading || uploading) && (
                <div className="w-full flex justify-start animate-pulse">
                   <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm font-medium text-slate-500">
                        {uploading ? "Analyzing image & Thinking..." : "Thinking..."}
                      </span>
                   </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              {pendingVision?.dataUrl && (
                <div className="mb-3 p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between w-fit animate-fade-in">
                  <div className="flex items-center gap-3">
                    <img src={pendingVision.dataUrl} alt="Preview" className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700">Photo Attached</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{pendingVision.name || 'image.jpg'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setPendingVision(null); savePendingVisionLS(sessionId, null); }}
                    className="ml-4 p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fdd142] min-h-[42px] max-h=[120px]"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="এখানে লিখুন…"
                />
                <input ref={fileRef} onChange={onFileChange} type="file" accept="image/*" className="hidden" />
                
                {/* Voice Input Button */}
                <button
                  onClick={() => {
                    if (isListening) {
                      stopListening();
                    } else {
                      resetTranscript();
                      setInput(""); // Clear existing input
                      startListening();
                      speak(t('Listening... Speak your message'));
                    }
                  }}
                  className={`border border-slate-300 hover:border-slate-400 px-3 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1 ${
                    isListening 
                      ? 'bg-red-500 text-white border-red-500' 
                      : 'bg-white text-slate-700'
                  }`}
                  title={t("Voice message (auto-send)")}
                  aria-label={isListening ? t("Recording... Click to stop") : t("Start voice message")}
                >
                  {isListening ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      🎤
                    </>
                  ) : (
                    '🎤'
                  )}
                </button>
                
                <button
                  onClick={onPickFile}
                  className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-2 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
                  title="Analyze photo"
                >
                  ছবি সংযুক্তি
                </button>
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-[#fdd142] hover:bg-[#f2c22f] disabled:opacity-60 text-slate-900 font-semibold px-4 py-2 rounded-xl shadow focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
                >
                  পাঠান
                </button>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                লোকেশন {geo ? "চালু" : "বন্ধ"} • সেশন: {sessionId ? String(sessionId).slice(0, 8) : "…"}
              </div>
            </div>
          </section>
        </div>
        <br /><br />
      </main>
      <Footer />
    </>
  );
}

