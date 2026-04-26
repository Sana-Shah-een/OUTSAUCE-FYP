"use client";

import React, { useEffect, useRef } from "react";

interface EtherealDustProps {
  isLightMode?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  maxSize: number;
  isAccent: boolean;
}

export const EtherealDust: React.FC<EtherealDustProps> = ({ isLightMode = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>(0);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false }); // Optimize performance
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Initialize particles (High Density)
    const particleCount = 450;
    particles.current = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Light Mode: 10-20% base (lighter). Dark Mode: 10-18% base
      const baseAlpha = isLightMode 
        ? 0.10 + Math.random() * 0.10 
        : 0.10 + Math.random() * 0.08;
      
      particles.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25, // Keep speed < 0.3
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.5 + 0.5,
        maxSize: Math.random() * 2 + 1.5, // Used for hover expansion
        baseAlpha: baseAlpha,
        isAccent: Math.random() > 0.8, // 20% of particles are brand red
      });
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onMouseLeave = () => {
      mouse.current.x = -1000;
      mouse.current.y = -1000;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseout", onMouseLeave);

    const draw = () => {
      // Base background color (Slightly darker slate to make white cards pop)
      ctx.fillStyle = isLightMode ? "#F1F5F9" : "#020617";
      ctx.fillRect(0, 0, width, height);

      // Add ambient Brand Red glow (Only in dark mode)
      if (!isLightMode) {
        const ambientGlow = ctx.createRadialGradient(width * 0.8, height * 0.2, 0, width * 0.8, height * 0.2, width * 0.7);
        ambientGlow.addColorStop(0, "rgba(196, 30, 30, 0.08)");
        ambientGlow.addColorStop(1, "rgba(2, 6, 23, 0)");
        ctx.fillStyle = ambientGlow;
        ctx.fillRect(0, 0, width, height);
      }
      const interactionRadius = 350; // Increased radius for better hover effect

      // Max alpha near cursor
      const maxAlpha = isLightMode ? 0.95 : 0.9;

      particles.current.forEach((p) => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges smoothly
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Distance to mouse
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let currentAlpha = p.baseAlpha;
        let currentSize = p.size;

        if (distance < interactionRadius) {
          // Stronger non-linear intensity curve for a richer glow
          const intensity = Math.pow(1 - distance / interactionRadius, 1.5);
          currentAlpha = p.baseAlpha + intensity * (maxAlpha - p.baseAlpha);
          currentSize = p.size + intensity * (p.maxSize - p.size);
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        
        // Use brand red for accent particles, otherwise theme base
        const pRGB = p.isAccent ? "196, 30, 30" : isLightMode ? "15, 23, 42" : "255, 255, 255";
        ctx.fillStyle = `rgba(${pRGB}, ${currentAlpha})`;
        ctx.fill();
      });

      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseLeave);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [isLightMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-50"
    />
  );
};
