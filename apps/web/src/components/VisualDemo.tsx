"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Search, Sparkles, Globe, ShieldCheck } from "lucide-react";

export const VisualDemo = () => {
  const leads = [
    { platform: "L", title: "React Developer", company: "Meta", color: "#0A66C2", city: "Remote" },
    { platform: "U", title: "UX Designer", company: "Startup", color: "#14a800", city: "London" },
    { platform: "F", title: "Mobile Dev", company: "Studio", color: "#1dbf73", city: "NYC" },
  ];

  return (
    <div className="relative w-full h-full p-6 flex flex-col gap-4 overflow-hidden bg-white/80 dark:bg-black/80 backdrop-blur-xl">
      {/* Top Glass Bar */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-red/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-brand-red/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-brand-red/10" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1.5 w-20 bg-black/5 dark:bg-white/10 rounded-full" />
          <div className="px-2.5 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-[9px] font-black text-brand-red flex items-center gap-1 uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5" /> Engine Active
          </div>
        </div>
      </div>

      {/* The Dynamic Feed */}
      <div className="space-y-4 relative z-10">
        <AnimatePresence mode="popLayout">
          {leads.map((lead, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: i * 0.15, 
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm flex items-center gap-4 group cursor-default hover:bg-white dark:hover:bg-white/10 hover:border-brand-red/30 hover:shadow-xl hover:shadow-brand-red/5 transition-all duration-300"
            >
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg"
                style={{ backgroundColor: lead.color }}
              >
                {lead.platform}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3.5 w-32 bg-text-main/10 dark:bg-white/20 rounded-full group-hover:bg-brand-red/20 transition-colors" />
                  <div className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[8px] font-bold text-text-muted">
                    {lead.city}
                  </div>
                </div>
                <div className="h-2 w-20 bg-text-muted/10 dark:bg-white/5 rounded-full" />
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="w-8 h-1.5 bg-black/5 dark:bg-white/10 rounded-full" />
                <div className="flex -space-x-1">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="w-4 h-4 rounded-full border border-white dark:border-black bg-black/5 dark:bg-white/10" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Search Interaction Floating Pill */}
      <motion.div 
        animate={{ 
          y: [0, -5, 0],
          boxShadow: [
            "0 10px 30px rgba(0,0,0,0.1)",
            "0 20px 40px rgba(196,30,30,0.15)",
            "0 10px 30px rgba(0,0,0,0.1)"
          ]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-brand-navy dark:bg-bg-main-light text-white dark:text-brand-navy flex items-center gap-3 border border-brand-red/30 z-30 shadow-2xl"
      >
        <div className="relative">
          <Search className="w-4 h-4 text-brand-red" />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-brand-red rounded-full"
          />
        </div>
        <div className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
          Scraping <span className="text-brand-red">Upwork</span>
          <span className="inline-block w-1 h-1 rounded-full bg-brand-red animate-ping" />
        </div>
      </motion.div>

      {/* Decorative Blur Orbs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-red/10 blur-[60px] rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-red/5 blur-[60px] rounded-full" />
    </div>
  );
};
