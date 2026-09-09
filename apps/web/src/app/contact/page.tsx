"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import { EtherealDust } from "../../components/EtherealDust";
import { OutsauceLogo } from "../../components/OutsauceLogo";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Send, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLightMode = theme === "light";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const lastname = formData.get("lastname") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;
    const fullName = `${name} ${lastname}`;

    try {
      const supabase = createClient();

      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert([{
          name: fullName,
          email: email,
          message: message
        }]);

      if (dbError) throw dbError;

      supabase.functions
        .invoke('send-contact-email', { body: { name: fullName, email, message } })
        .catch((fnErr: unknown) =>
          console.warn('[Contact] Edge fn notification skipped:', (fnErr as any)?.message),
        );

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen selection:bg-brand-red/30 selection:text-text-main font-sans flex flex-col">
      {mounted && <EtherealDust isLightMode={isLightMode} />}

      <header className="relative z-10 pt-20 pb-10 px-6 max-w-5xl mx-auto w-full">
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
          className="text-center md:text-left"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-main mb-6">Get in touch</h1>
          <p className="text-xl text-text-muted font-medium max-w-2xl">
            Have a question, feedback, or need support? We'd love to hear from you. Drop us a message below.
          </p>
        </motion.div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-24 w-full flex-1 flex flex-col md:flex-row gap-12 lg:gap-20">

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:w-1/3 flex flex-col gap-8 pt-4"
        >
          <div className="flex flex-col gap-3">
            <div className="h-12 w-12 rounded-2xl bg-brand-red/10 flex items-center justify-center text-brand-red mb-2 ring-1 ring-brand-red/20">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold text-text-main">Email Us</h3>
            <p className="text-text-muted">Our friendly team is here to help.</p>
            <a 
              href="https://mail.google.com/mail/?view=cm&fs=1&to=outsauce.official@gmail.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-red font-semibold hover:underline mt-1"
            >
              outsauce.official@gmail.com
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="md:w-2/3"
        >
          <div className="p-8 md:p-10 rounded-[2rem] bg-white/90 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] backdrop-blur-xl shadow-xl relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-6 relative z-10"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="text-sm font-semibold text-text-main">First name</label>
                      <input
                        required
                        type="text"
                        id="name"
                        name="name"
                        className="w-full bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red/50 transition-all"
                        placeholder="Jane"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="lastname" className="text-sm font-semibold text-text-main">Last name</label>
                      <input
                        type="text"
                        id="lastname"
                        name="lastname"
                        className="w-full bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red/50 transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-semibold text-text-main">Email</label>
                    <input
                      required
                      type="email"
                      id="email"
                      name="email"
                      className="w-full bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red/50 transition-all"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="message" className="text-sm font-semibold text-text-main">Message</label>
                    <textarea
                      required
                      id="message"
                      name="message"
                      rows={5}
                      className="w-full bg-white dark:bg-black/20 border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red/50 transition-all resize-none"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-brand-red hover:bg-brand-red/90 text-white font-semibold h-12 shadow-[0_0_20px_rgba(196,30,30,0.3)] hover:shadow-[0_0_30px_rgba(196,30,30,0.5)] transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100 mt-2"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Message <Send className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-12 relative z-10"
                >
                  <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 ring-1 ring-emerald-500/20">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-main mb-3">Message Sent!</h3>
                  <p className="text-text-muted mb-8 max-w-xs mx-auto">
                    Email sent, our team will get in touch with you soon.
                  </p>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="rounded-full border-black/10 dark:border-white/10 text-text-main hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    Send another message
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-black/[0.08] dark:border-white/[0.08] relative z-10 bg-bg-main-light/80 dark:bg-brand-navy/80 backdrop-blur-lg mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <OutsauceLogo className="h-6" />
          <p className="text-sm text-text-muted">© {new Date().getFullYear()} Outsauce. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
