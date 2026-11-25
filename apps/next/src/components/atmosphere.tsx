"use client";

import { useEffect, useRef } from "react";

export function Atmosphere() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = layer.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const onMove = (event: PointerEvent) => {
      node.style.setProperty("--mx", `${event.clientX}px`);
      node.style.setProperty("--my", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={layer} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="orb orb-rose" />
      <div className="orb orb-mint" />
      <div className="orb orb-violet" />
      <div className="glow" />
    </div>
  );
}
