"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import { EtherealDust } from "../../components/EtherealDust";
import { OutsauceLogo } from "../../components/OutsauceLogo";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-main mb-6">Privacy Policy</h1>
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
          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4 first:mt-0">1. Information We Collect</h2>
          <p className="text-text-muted leading-relaxed mb-6">We collect information to provide better services to all our users. The types of data we collect include:</p>
          <ul className="list-disc pl-6 mb-8 space-y-2 text-text-muted">
            <li className="leading-relaxed"><strong className="text-text-main">Account Information:</strong> Name, email address, and password when you register.</li>
            <li className="leading-relaxed"><strong className="text-text-main">Usage Data:</strong> Information on how you interact with our platform, search queries, and saved leads.</li>
            <li className="leading-relaxed"><strong className="text-text-main">Device Data:</strong> Information about your browser, IP address, and device type.</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4">2. How We Use Your Data</h2>
          <p className="text-text-muted leading-relaxed mb-6">The data we collect is utilized to enhance your experience. Specifically, we use your information to:</p>
          <ul className="list-disc pl-6 mb-8 space-y-2 text-text-muted">
            <li className="leading-relaxed">Provide, operate, and maintain our platform.</li>
            <li className="leading-relaxed">Personalize your experience through our AI matching and content engine.</li>
            <li className="leading-relaxed">Communicate with you regarding updates, security alerts, and support messages.</li>
            <li className="leading-relaxed">Analyze usage patterns to improve our features.</li>
          </ul>

          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4">3. Cookies and Tracking</h2>
          <p className="text-text-muted leading-relaxed mb-6">We use cookies and similar tracking technologies to track the activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.</p>

          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4">4. Data Protection and Security</h2>
          <p className="text-text-muted leading-relaxed mb-6">The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. We use commercially acceptable means, including encrypted databases and secure API channels, to protect your personal data, but we cannot guarantee its absolute security.</p>

          <h2 className="text-2xl font-bold text-text-main mt-8 mb-4">5. Your Rights</h2>
          <p className="text-text-muted leading-relaxed mb-6">Depending on your location, you may have the right to access, update, or delete the information we have on you. Whenever made possible, you can access, update, or request deletion of your personal data directly within your account settings section.</p>
          
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
