import { useNavigate } from "react-router-dom";

export default function ChatButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/assistant")}
      className="fixed bottom-8 right-8 bg-[#0f172a] w-16 h-16 flex flex-col items-center justify-center rounded-full shadow-lg hover:bg-[#121a31] transition transform hover:scale-110 text-center text-white"
      aria-label="Open AI Assistant"
      title="Ask Paw Protector Assistant"
    >
      {/* <img src="/icons/chat-bubble.png" alt="Chat icon" className="w-6 h-6 mb-1" /> */}
      <span className="text-[10px] font-semibold leading-none">Assistant</span>
    </button>
  );
}