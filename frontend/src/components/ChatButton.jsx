import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function ChatButton() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <button
      onClick={() => navigate("/assistant")}
      className="fixed bottom-8 right-8 bg-[#0f172a] w-16 h-16 flex flex-col items-center justify-center rounded-full shadow-lg hover:bg-[#121a31] transition transform hover:scale-110 text-center text-white focus:outline-none focus:ring-4 focus:ring-[#fdd142] focus:ring-offset-2"
      aria-label={t("Open AI Assistant")}
      title={t("Ask PawPal Assistant")}
    >
      {/* <img src="/icons/chat-bubble.png" alt="Chat icon" className="w-6 h-6 mb-1" /> */}
      <span className="text-[10px] font-semibold leading-none">{t("Assistant")}</span>
    </button>
  );
}