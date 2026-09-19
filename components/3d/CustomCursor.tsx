"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const canvas = canvasRef.current;
    if (!dot || !ring || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Target and current positions
    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHovering = false;
    let isClicking = false;
    let isDragging = false;
    let isOver3D = false;

    // Trail particle pool
    const particles: Array<{ x: number; y: number; alpha: number; radius: number }> = [];
    const MAX_PARTICLES = 16;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Add a subtle precision particle when moving
      if (particles.length < MAX_PARTICLES && (Math.abs(mouseX - ringX) > 4 || Math.abs(mouseY - ringY) > 4)) {
        particles.push({
          x: mouseX,
          y: mouseY,
          alpha: 0.45,
          radius: 1.2,
        });
      }

      // Check hover state efficiently
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive =
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.closest("button") ||
          target.closest("a") ||
          target.getAttribute("role") === "button" ||
          target.dataset.interactive === "true";

        const is3DElement =
          target.tagName === "CANVAS" ||
          target.dataset.threescene === "true" ||
          target.closest(".canvas-3d-container");

        isHovering = !!isInteractive;
        isOver3D = !!is3DElement;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      isClicking = true;
      if (e.buttons === 1) isDragging = true;
    };

    const onMouseUp = () => {
      isClicking = false;
      isDragging = false;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    let animId: number;

    const render = () => {
      // Smooth interpolation
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;

      // Update dot transform directly via ref
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${
        isClicking ? 0.6 : isHovering ? 1.4 : 1
      })`;

      // Update ring transform & style directly via ref
      const ringScale = isClicking ? 0.75 : isHovering ? 1.5 : isOver3D ? 1.3 : 1;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${ringScale})`;

      if (isHovering) {
        ring.style.borderColor = "rgba(6, 182, 212, 0.85)";
        ring.style.boxShadow = "0 0 12px rgba(6, 182, 212, 0.35)";
      } else if (isOver3D) {
        ring.style.borderColor = "rgba(168, 85, 247, 0.85)";
        ring.style.boxShadow = "0 0 12px rgba(168, 85, 247, 0.35)";
      } else {
        ring.style.borderColor = "rgba(148, 163, 184, 0.45)";
        ring.style.boxShadow = "none";
      }

      // Draw subtle precision trail particles on canvas
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.alpha -= 0.025;
        p.radius = Math.max(0.2, p.radius - 0.04);

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Particle Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Outer Precision Reticle Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-6 h-6 rounded-full border pointer-events-none transition-[border-color,box-shadow] duration-150 will-change-transform"
        style={{
          borderColor: "rgba(148, 163, 184, 0.45)",
        }}
      />

      {/* Central Precision Reticle Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-cyan-400 pointer-events-none will-change-transform shadow-[0_0_8px_#22d3ee]"
      />
    </div>
  );
}
