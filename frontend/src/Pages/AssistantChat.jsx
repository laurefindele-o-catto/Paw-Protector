import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useAutoTranslate } from "react-autolocalise";
// import Footer from "../Components/Footer";
import apiConfig from "../config/apiConfig";
import { useAuth } from "../context/AuthContext";
import { usePet } from "../context/PetContext";

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

const HF_ENDPOINT = "https://pritombiswas9999-disease-classifier.hf.space/predict";

export default function AssistantChat() {
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const { selectedPet } = usePet?.() || {};
  const geo = useGeo();
  const { t: translate } = useAutoTranslate();

  // translation state
  const [useTranslation, setUseTranslation] = useState(true);
  const t = useTranslation && translate ? translate : (s) => s;

  const handleTranslationToggle = (newState) => {
    setUseTranslation(newState);
  };

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
    setInput("");
    const userMsg = { role: "user", content, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      // If a photo is attached, analyze it now (deferred) and store evidence
      if (pendingVision?.dataUrl) {
        setUploading(true);
        try {
          const file = await dataUrlToFile(pendingVision.dataUrl, pendingVision.name || 'photo.jpg');
          const form = new FormData();
          form.append("image", file);
          const uploadRes = await fetch(HF_ENDPOINT, { method: "POST", body: form });
          const uploadData = await uploadRes.json().catch(() => ({}));
          const label = uploadData?.label || "Unknown";
          // Persist vision evidence so RAG can use it
          await fetch(`${apiConfig.baseURL}${apiConfig.chat.vision}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ session_id: sessionId, pet_id: petId, label, source: pendingVision.name || 'photo.jpg' })
          });
        } catch {
          // soft-fail; continue without vision context
        } finally {
          setUploading(false);
        }
      }

      const body = {
        session_id: sessionId,
        content,
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
      setPendingVision(null); // clear one-time attachment after using it
      savePendingVisionLS(sessionId, null);
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
      <Header 
        translationState={useTranslation} 
        onTranslationToggle={handleTranslationToggle}
      />
      <div className="min-h-screen bg-[#edfdfd] text-slate-900 pt-28 mt-24">
        <div className="mx-auto max-w-6xl px-4 flex h-[70vh]">
          {/* Collapsible Sidebar */}
          <aside
            className={`transition-all duration-200 ease-in-out
              ${sidebarOpen ? "w-64" : "w-0"}
              bg-white border-r border-slate-200 shadow-sm rounded-l-2xl flex flex-col overflow-hidden`}
            style={{ minWidth: sidebarOpen ? "16rem" : "0", maxWidth: "16rem" }}
          >
            <div className={`flex items-center justify-between p-3 border-b border-slate-200 ${sidebarOpen ? "" : "hidden"}`}>
              <span className="font-semibold text-slate-800">Chats</span>
              <button
                onClick={createNewSession}
                className="text-xs bg-[#0f172a] text-white px-2 py-1 rounded-lg hover:bg-slate-900"
              >
                New
              </button>
            </div>
            <div className={`flex-1 overflow-y-auto ${sidebarOpen ? "" : "hidden"}`}>
              {sessions.length === 0 && (
                <div className="text-slate-500 text-sm p-3">No chats yet.</div>
              )}
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => switchSession(s.id)}
                  className={`w-full text-left px-3 py-2 border-b border-slate-100 hover:bg-slate-50 ${sessionId === s.id ? 'bg-yellow-50' : ''}`}
                >
                  <div className="text-sm font-medium text-slate-800 truncate">{s.title || `Chat ${s.id}`}</div>
                  <div className="text-[11px] text-slate-500">#{s.id} {s.pet_id ? `• Pet ${s.pet_id}` : ''}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className={`absolute left-2 top-32 z-10 bg-[#fdd142] text-[#0f172a] rounded-full shadow px-2 py-1 font-bold text-lg
              ${sidebarOpen ? "" : "border border-slate-300"}
              md:left-2`}
            style={{ transition: "left 0.2s" }}
            aria-label={sidebarOpen ? "Hide chat sessions" : "Show chat sessions"}
          >
            {sidebarOpen ? "⟨" : "⟩"}
          </button>

          {/* Chat panel */}
          <section className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">
                  Ask about symptoms, vaccines, deworming, diseases, or find nearby vets. You can also analyze a photo.
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`w-full flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`${m.role === "user" ? "bg-[#fdd142] text-slate-900" : "bg-[#f9fafb] text-slate-800"} max-w-[80%] rounded-2xl px-3 py-2 shadow`}>
                    <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="w-full flex justify-start">
                  <div className="bg-[#f9fafb] text-slate-800 max-w-[80%] rounded-2xl px-3 py-2 shadow">
                    <div className="text-sm">Thinking…</div>
                  </div>
                </div>
              )}
              {uploading && (
                <div className="w-full flex justify-start">
                  <div className="bg-[#f9fafb] text-slate-800 max-w-[80%] rounded-2xl px-3 py-2 shadow">
                    <div className="text-sm">Analyzing photo…</div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-white">
              {pendingVision?.dataUrl && (
                <div className="mb-2 flex items-center gap-3">
                  <img src={pendingVision.dataUrl} alt="attached" className="h-8 w-8 rounded object-cover border border-slate-200" />
                  <span className="text-xs text-slate-700">সংযুক্ত ছবি প্রস্তুত — বার্তা পাঠালে বিশ্লেষণ হবে</span>
                  <button
                    onClick={() => { setPendingVision(null); savePendingVisionLS(sessionId, null); }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    মুছে দিন
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
                <button
                  onClick={onPickFile}
                  className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-2 rounded-xl shadow-sm"
                  title="Analyze photo"
                >
                  ছবি সংযুক্তি
                </button>
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-[#fdd142] hover:bg-[#f2c22f] disabled:opacity-60 text-slate-900 font-semibold px-4 py-2 rounded-xl shadow"
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
      </div>
      {/* <Footer /> */}
    </>
  );
}