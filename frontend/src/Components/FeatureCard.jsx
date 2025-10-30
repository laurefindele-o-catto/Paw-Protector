// src/components/FeatureCard.jsx
import { Link } from "react-router-dom";
import { useState } from "react";

export default function FeatureCard({ to, children, color = "#fff" }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={to}
      style={{
        backgroundColor: isHovered ? "#E0E7FF" : color, // #E0E7FF is indigo-50
      }}
      className="
        shadow-md rounded-2xl flex items-center justify-center
        text-purple-700 font-semibold transition
        aspect-square w-48 min-w-[180px] snap-center
      "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-center leading-tight">{children}</div>
    </Link>
  );
}
