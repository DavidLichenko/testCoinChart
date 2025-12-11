"use client";

import type React from "react";
import { SidebarNav } from "./components/sidebar-nav";
import { useEffect, useRef } from "react";

// Particle background component
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }> = [];

    // Reduced particle count for better performance
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4, // Slightly slower
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
      });
    }

    const animate = () => {
      // Slightly lighter background
      ctx.fillStyle = "rgba(11, 11, 13, 0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        // Slightly more visible particles
        ctx.fillStyle = `rgba(139, 92, 246, ${0.1 + Math.random() * 0.1})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "#0b0b0d" }}
    />
  );
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-max max-w-screen-2xl mx-auto w-full relative min-h-screen bg-zinc-950">
      <ParticleBackground />
      <div className="relative z-10 flex min-h-full">
        {/* Sidebar */}
        <div className="hidden w-80 flex-shrink-0 h-full p-4 md:block">
          <SidebarNav />
        </div>
        
        {/* Main Content with max-w-screen-2xl */}
        <div className="flex-1 overflow-auto w-full h-fit">
          <div className="relative">
            <div className="max-w-screen-2xl px-4 py-6 mx-auto">
              {/* Deep dark blue-purple background with gradient */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0d0d1a] via-[#12121f] to-[#0f0f1c] backdrop-blur-lg border border-purple-500/10 p-6 min-h-[calc(100vh-8rem)] shadow-[0_8px_30px_rgb(0,0,0,0.6),0_0_80px_rgb(139,92,246,0.03)]">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
