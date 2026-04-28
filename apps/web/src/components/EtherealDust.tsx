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

    const ctx = canvas.getContext("2d", { alpha: false });
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

    const particleCount = 450;
    particles.current = [];

    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = isLightMode
        ? 0.10 + Math.random() * 0.10
        : 0.10 + Math.random() * 0.08;

      particles.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.5 + 0.5,
        maxSize: Math.random() * 2 + 1.5,
        baseAlpha: baseAlpha,
        isAccent: Math.random() > 0.8,
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
      ctx.fillStyle = isLightMode ? "#F1F5F9" : "#020617";
      ctx.fillRect(0, 0, width, height);

      if (!isLightMode) {
        const ambientGlow = ctx.createRadialGradient(width * 0.8, height * 0.2, 0, width * 0.8, height * 0.2, width * 0.7);
        ambientGlow.addColorStop(0, "rgba(196, 30, 30, 0.08)");
        ambientGlow.addColorStop(1, "rgba(2, 6, 23, 0)");
        ctx.fillStyle = ambientGlow;
        ctx.fillRect(0, 0, width, height);
      }
      const interactionRadius = 350;

      const maxAlpha = isLightMode ? 0.95 : 0.9;

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let currentAlpha = p.baseAlpha;
        let currentSize = p.size;

        if (distance < interactionRadius) {
          const intensity = Math.pow(1 - distance / interactionRadius, 1.5);
          currentAlpha = p.baseAlpha + intensity * (maxAlpha - p.baseAlpha);
          currentSize = p.size + intensity * (p.maxSize - p.size);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

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
