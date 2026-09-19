"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const springConfig = { damping: 28, stiffness: 450, mass: 0.2 };
  const cursorX = useSpring(-100, springConfig);
  const cursorY = useSpring(-100, springConfig);

  const ringConfig = { damping: 22, stiffness: 220, mass: 0.6 };
  const ringX = useSpring(-100, ringConfig);
  const ringY = useSpring(-100, ringConfig);

  const trailConfig = { damping: 18, stiffness: 140, mass: 0.9 };
  const trailX = useSpring(-100, trailConfig);
  const trailY = useSpring(-100, trailConfig);

  useEffect(() => {
    // Only enable on desktop fine pointer devices
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      ringX.set(e.clientX);
      ringY.set(e.clientY);
      trailX.set(e.clientX);
      trailY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT" ||
          target.closest("button") ||
          target.closest("a") ||
          target.getAttribute("role") === "button" ||
          target.dataset.interactive === "true")
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [cursorX, cursorY, ringX, ringY, trailX, trailY]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Soft chromatic trail aura */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{
          x: trailX,
          y: trailY,
          width: isHovered ? 64 : 40,
          height: isHovered ? 64 : 40,
          background: isHovered
            ? "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(6,182,212,0.08) 50%, transparent 70%)"
            : "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
        }}
        transition={{ type: "spring", stiffness: 180, damping: 25 }}
      />

      {/* Ambient optical reticle ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border pointer-events-none -translate-x-1/2 -translate-y-1/2 backdrop-blur-[0.5px]"
        style={{
          x: ringX,
          y: ringY,
          width: isHovered ? 52 : 30,
          height: isHovered ? 52 : 30,
          borderColor: isHovered
            ? "rgba(6, 182, 212, 0.9)"
            : "rgba(168, 85, 247, 0.45)",
          backgroundColor: isHovered
            ? "rgba(6, 182, 212, 0.06)"
            : "rgba(168, 85, 247, 0.02)",
          boxShadow: isHovered
            ? "0 0 24px rgba(6, 182, 212, 0.35), inset 0 0 12px rgba(6, 182, 212, 0.15)"
            : "0 0 10px rgba(168, 85, 247, 0.15)",
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      />

      {/* Precision central reticle dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-cyan-300 pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-[0_0_12px_#22d3ee]"
        style={{
          x: cursorX,
          y: cursorY,
          scale: isClicking ? 0.5 : isHovered ? 1.6 : 1,
        }}
      />
    </div>
  );
}
