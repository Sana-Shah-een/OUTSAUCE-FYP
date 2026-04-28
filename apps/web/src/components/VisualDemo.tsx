"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Users, Globe, Sparkles, Bell, Settings, CreditCard, LayoutDashboard, MessageSquare } from "lucide-react";

export const VisualDemo = () => {
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Search, label: "Hunts" },
    { icon: Users, label: "Leads" },
    { icon: Globe, label: "Network" },
    { icon: MessageSquare, label: "Messages" },
    { icon: Sparkles, label: "AI Tools" },
    { icon: Bell, label: "Notifications" },
  ];

  const metrics = [
    { title: "Active Hunts", value: "3", color: "#C41E1E" },
    { title: "Leads Saved", value: "47 / 200", color: "#3B82F6" },
    { title: "Network", value: "12", color: "#10B981" },
    { title: "AI Gens", value: "8 / 10", color: "#F59E0B" },
  ];

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-[#F1F5F9] dark:bg-[#020617]">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-[72px] flex-shrink-0 border-r border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-[#020617]/80 flex flex-col items-center pt-5 pb-4 gap-1"
      >
        <div className="mb-4 flex flex-col items-center">
          <div className="w-2 h-8 bg-brand-red rounded-sm" />
        </div>

        {sidebarItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              item.active
                ? "bg-brand-red/10 text-brand-red"
                : "text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60"
            }`}
          >
            <item.icon className="w-4 h-4" />
          </motion.div>
        ))}

        <div className="mt-auto flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black/30 dark:text-white/30">
            <Settings className="w-4 h-4" />
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black/30 dark:text-white/30">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-12 border-b border-black/[0.05] dark:border-white/[0.05] bg-white/60 dark:bg-[#020617]/60 backdrop-blur-xl flex items-center justify-between px-4"
        >
          <div className="w-3 h-3 rounded border border-black/10 dark:border-white/10" />
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
            <span className="text-[8px] text-black/40 dark:text-white/40 font-medium hidden sm:inline">outsauce.test@user.com</span>
            <div className="w-6 h-6 rounded-full bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-[8px] font-bold text-brand-red">O</div>
          </div>
        </motion.div>

        <div className="flex-1 p-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-4"
          >
            <h3 className="text-sm font-extrabold text-black/90 dark:text-white/90 tracking-tight">
              Welcome back, OutSauce Test User
            </h3>
            <p className="text-[8px] text-black/40 dark:text-white/40 mt-0.5">Here is what&apos;s happening with your account today.</p>
          </motion.div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {metrics.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl p-3 bg-white/80 dark:bg-white/[0.06] border border-white dark:border-white/[0.08] shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[7px] font-medium text-black/40 dark:text-white/40">{m.title}</span>
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: m.color + "18" }}>
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: m.color }} />
                  </div>
                </div>
                <p className="text-sm font-bold text-black/80 dark:text-white/80 tracking-tight">{m.value}</p>
                <div className="h-1 w-10 bg-black/5 dark:bg-white/5 rounded-full mt-1" />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="col-span-2 rounded-2xl p-3 bg-white/80 dark:bg-white/[0.06] border border-white dark:border-white/[0.08] shadow-sm"
            >
              <p className="text-[9px] font-bold text-black/80 dark:text-white/80 mb-2">Getting Started</p>
              {["Set up your profile", "Configure a hunt", "Save leads"].map((step, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <div className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center text-[6px] font-bold text-black/30 dark:text-white/30">
                    {i + 1}
                  </div>
                  <span className="text-[7px] font-medium text-black/50 dark:text-white/50">{step}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="rounded-2xl p-3 bg-white/80 dark:bg-white/[0.06] border border-white dark:border-white/[0.08] shadow-sm"
            >
              <p className="text-[9px] font-bold text-black/80 dark:text-white/80 mb-2">Quick Actions</p>
              {[
                { icon: Search, label: "New Hunt" },
                { icon: Sparkles, label: "Generate Content" },
                { icon: Globe, label: "Browse Network" },
              ].map((action, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-md bg-black/[0.03] dark:bg-white/5 flex items-center justify-center">
                    <action.icon className="w-2.5 h-2.5 text-black/30 dark:text-white/30" />
                  </div>
                  <span className="text-[7px] font-semibold text-black/50 dark:text-white/50">{action.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-red/10 blur-[60px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-red/5 blur-[60px] rounded-full pointer-events-none" />
    </div>
  );
};
