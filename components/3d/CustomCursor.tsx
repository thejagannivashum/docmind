"use client";

import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const springConfig = { damping: 25, stiffness: 350 };
  const cursorX = useSpring(-100, springConfig);
  const cursorY = useSpring(-100, springConfig);
  const ringX = useSpring(-100, { damping: 20, stiffness: 200 });
  const ringY = useSpring(-100, { damping: 20, stiffness: 200 });

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      ringX.set(e.clientX);
      ringY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "BUTTON" ||
          target.tagName === "A" ||
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
  }, [cursorX, cursorY, ringX, ringY]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Central reticle dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-cyan-400 pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#22d3ee]"
        style={{
          x: cursorX,
          y: cursorY,
          scale: isClicking ? 0.6 : isHovered ? 1.5 : 1,
        }}
      />

      {/* Outer ambient tracking ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border border-cyan-500/40 pointer-events-none -translate-x-1/2 -translate-y-1/2 backdrop-blur-[1px]"
        style={{
          x: ringX,
          y: ringY,
          width: isHovered ? 48 : 28,
          height: isHovered ? 48 : 28,
          borderColor: isHovered ? "rgba(34, 211, 238, 0.8)" : "rgba(147, 51, 234, 0.4)",
          backgroundColor: isHovered ? "rgba(34, 211, 238, 0.08)" : "transparent",
          boxShadow: isHovered ? "0 0 20px rgba(34, 211, 238, 0.3)" : "none",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
    </div>
  );
}
