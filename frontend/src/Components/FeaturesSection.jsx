// src/components/FeaturesSection.jsx
import { useEffect, useRef } from "react";
import FeatureCard from "./FeatureCard";

export default function FeaturesSection() {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Only auto-scroll on mobile/smaller screens
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 1024) return;

    const el = scrollRef.current;
    if (!el) return;

    let intervalId = null;
    let step = 1.2; // pixels per tick (adjust speed)
    const tick = 16; // ~60fps

    const start = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (!el) return;
        el.scrollLeft += step;

        // when reach end, smooth reset to start
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        }
      }, tick);
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    start();

    // Pause on user interaction
    el.addEventListener("touchstart", stop, { passive: true });
    el.addEventListener("mousedown", stop);
    el.addEventListener("mouseenter", stop);
    el.addEventListener("mouseleave", start);

    // Cleanup
    return () => {
      stop();
      el.removeEventListener("touchstart", stop);
      el.removeEventListener("mousedown", stop);
      el.removeEventListener("mouseenter", stop);
      el.removeEventListener("mouseleave", start);
    };
  }, []);

  return (
    <section className="px-6 mt-6 py-8 flex justify-center" style={{ backgroundColor: "#FAF6E9" }}>
      <div
        ref={scrollRef}
        className="
          flex overflow-x-auto gap-6 px-4 hide-scrollbar
          lg:grid lg:grid-cols-5 lg:overflow-visible
          snap-x snap-mandatory scroll-smooth
          justify-center max-w-6xl
        "
      >
        <FeatureCard to="/paw-pal" color="#A7AAE1">🐾 PawPal</FeatureCard>
        <FeatureCard to="/disease-detection" color = "#F2AEBB">Disease<br/>Detection</FeatureCard>
        <FeatureCard to="/petcare" color="#A1D6CB">Pet Care</FeatureCard>
        <FeatureCard to="/find-a-vet" color="#BFECFF">Find a Vet</FeatureCard>
        <FeatureCard to="/vaccination-alerts" color="#E6D9A2"> Vaccination<br/>Alerts</FeatureCard>
      </div>
      
    </section>
  );
}
