// src/components/FeatureCard.jsx
import { Link } from "react-router-dom";
import { useState } from "react";

export default function FeatureCard({ to, children }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={to}
      className={`
        px-6 py-2 mx-1
        font-semibold text-base
        whitespace-nowrap
        rounded-full
        transition
        duration-150
        border-2 border-transparent
        
        hover:text-[#0f172a]
        hover:bg-[#fdd142]/10
        focus:outline-none
        focus:ring-2 focus:ring-[#fdd142]/40
        shadow-none
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "none",
        color: isHovered ? "#0f172a" : "#22223b",
        fontWeight: isHovered ? 700 : 600,
        letterSpacing: "0.01em",
      }}
    >
      <span className="inline-block align-middle">{children}</span>
    </Link>
  );
}
