"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import { EtherealDust } from "../../components/EtherealDust";
import { OutsauceLogo } from "../../components/OutsauceLogo";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLightMode = theme === "light";

  return (
    <div className="relative min-h-screen selection:bg-brand-red/30 selection:text-text-main font-sans flex flex-col">
      {mounted && <EtherealDust isLightMode={isLightMode} />}
      
      <header className="relative z-10 pt-20 pb-10 px-6 max-w-4xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Link href="/">
            <Button variant="outline" className="rounded-full gap-2 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-text-main transition-colors h-10 px-5 font-semibold text-sm backdrop-blur-md">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-main mb-6">Terms of Service</h1>
          <p className="text-xl text-text-muted font-medium">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pb-24 w-full flex-1">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-8 md:p-12 rounded-[2rem] bg-white/90 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] backdrop-blur-xl shadow-xl max-w-none"
        >
          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4 first:mt-0">1. Introduction</h2>
          <p className="text-text-muted leading-relaxed mb-6">Welcome to Outsauce. By accessing or using our platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
          
          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4">2. User Responsibilities</h2>
          <p className="text-text-muted leading-relaxed mb-6">You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.</p>
          <ul className="list-disc pl-6 mb-8 space-y-2 text-text-muted">
            <li className="leading-relaxed">You must provide accurate and complete information upon registration.</li>
            <li className="leading-relaxed">You may not use the platform for any illegal or unauthorized purpose.</li>
            <li className="leading-relaxed">Your use of the service must not violate any applicable laws.</li>
          </ul>

          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4">3. Acceptable Use</h2>
          <p className="text-text-muted leading-relaxed mb-6">The Outsauce platform is designed to aggregate opportunities and facilitate professional networking. Any abuse of the system, including but not limited to aggressive scraping outside of permitted limits, spamming users, or distributing malicious content, will result in immediate termination of your account.</p>

          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4">4. Limitations of Liability</h2>
          <p className="text-text-muted leading-relaxed mb-6">In no event shall Outsauce, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4">5. Termination</h2>
          <p className="text-text-muted leading-relaxed mb-6">We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination.</p>
          
          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4">6. Contact Us</h2>
          <p className="text-text-muted leading-relaxed mb-6">If you have any questions about these Terms, please contact us at <a href="https://mail.google.com/mail/?view=cm&fs=1&to=outsauce.official@gmail.com" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">outsauce.official@gmail.com</a>.</p>
        </motion.div>
      </main>
      
      <footer className="border-t border-black/[0.08] dark:border-white/[0.08] relative z-10 bg-bg-main-light/80 dark:bg-brand-navy/80 backdrop-blur-lg mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <OutsauceLogo className="h-6" />
          <p className="text-sm text-text-muted">© {new Date().getFullYear()} Outsauce. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
