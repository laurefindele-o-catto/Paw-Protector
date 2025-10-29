// src/components/FeatureCard.jsx
import { Link } from "react-router-dom";

export default function FeatureCard({ to, children }) {
  return (
    <Link
      to={to}
      className="
        bg-white shadow-md rounded-2xl flex items-center justify-center
        text-purple-700 font-semibold hover:bg-indigo-50 transition
        aspect-square w-48 min-w-[180px] snap-center
      "
    >
      <div className="text-center leading-tight">{children}</div>
    </Link>
  );
}
