"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import { EtherealDust } from "@/components/EtherealDust";
import { OutsauceLogo } from "@/components/OutsauceLogo";
import { Sun, Moon, ArrowLeft } from "lucide-react";

export function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLightMode = theme === "light";

  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-brand-red/30 selection:text-text-main flex flex-col">
      {mounted && <EtherealDust isLightMode={isLightMode} />}

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-8 left-8 z-50"
      >
        <Link href="/" className="group flex items-center gap-2 text-text-muted hover:text-text-main transition-all duration-300">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 dark:bg-white/10 border-2 border-brand-red/50 dark:border-white/20 backdrop-blur-md group-hover:border-brand-red group-hover:shadow-[0_0_20px_rgba(196,30,30,0.3)] transition-all">
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </div>
          <span className="hidden sm:inline text-sm font-bold tracking-tight">Back to Home</span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-8 right-8 z-50"
      >
        {mounted && (
          <button
            onClick={() => setTheme(isLightMode ? "dark" : "light")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 dark:bg-white/10 border-2 border-brand-red/50 dark:border-white/20 backdrop-blur-md text-text-muted hover:text-brand-red hover:border-brand-red hover:shadow-[0_0_20px_rgba(196,30,30,0.3)] transition-all duration-300"
            aria-label="Toggle theme"
          >
            {isLightMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        )}
      </motion.div>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 -mt-[15px]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="relative z-10 mb-6"
        >
          <Link href="/">
             <OutsauceLogo className="h-14 w-auto" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
          className="w-full max-w-md relative z-10"
        >
          <div className="group relative overflow-hidden rounded-[32px] p-6 sm:p-8 bg-white/95 dark:bg-[#020617]/80 border-2 border-brand-red/40 dark:border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-[24px] flex flex-col hover:-translate-y-[5px] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
             <div className="absolute inset-0 rounded-[32px] pointer-events-none ring-1 ring-inset ring-white/10 dark:ring-white/5" />

             <div className="relative z-10 flex flex-col w-full">
                {children}
             </div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-black/[0.08] dark:border-white/[0.08] relative z-10 bg-white/50 dark:bg-brand-navy/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center text-text-main">
            <OutsauceLogo className="h-7" />
          </div>

          <div className="flex gap-8 text-sm font-semibold text-text-muted">
            <Link href="/privacy" className="hover:text-brand-red transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-brand-red transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-brand-red transition-colors">Contact</Link>
          </div>

          <p className="text-sm font-medium text-text-muted">
            © {new Date().getFullYear()} Outsauce. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
