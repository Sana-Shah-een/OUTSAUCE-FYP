"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";

interface BentoCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  interactive?: boolean;
}

export function BentoCard({ 
  children, 
  className, 
  delay = 0,
  interactive = true,
  ...props 
}: BentoCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={interactive ? { y: -5, scale: 1.01 } : {}}
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-[32px] p-6 md:p-8",
        "bg-gradient-to-br from-white to-white/70 border border-white shadow-[0_12px_40px_rgba(0,0,0,0.06)]",
        "dark:bg-gradient-to-br dark:from-white/[0.08] dark:to-transparent dark:border-white/[0.08] dark:shadow-[0_12px_48px_rgba(0,0,0,0.6)]",
        "backdrop-blur-2xl",
        "hover:shadow-[0_20px_60px_rgba(196,30,30,0.12)] dark:hover:shadow-[0_20px_60px_rgba(196,30,30,0.2)]",
        "transition-shadow duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-[32px] pointer-events-none ring-1 ring-inset ring-white/20 dark:ring-white/5" />
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(196,30,30,.1), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
