"use client";

import { useState, useEffect } from "react";
import { motion, useScroll } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import { EtherealDust } from "../../components/EtherealDust";
import { OutsauceLogo } from "../../components/OutsauceLogo";
import { Button } from "../../components/ui/button";
import {
  Sun,
  Moon,
  ArrowRight,
  Quote,
  ArrowLeft
} from "lucide-react";

export default function LearnMorePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const [activeSection, setActiveSection] = useState("the-broken-market");

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const sections = ["the-broken-market", "the-architecture", "the-visual-crm", "the-ai-edge", "the-network-effect"];
      let currentSection = sections[0];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 250) {
            currentSection = section;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLightMode = theme === "light";

  const navLinks = [
    { id: "the-broken-market", label: "01. The Broken Market" },
    { id: "the-architecture", label: "02. The Architecture" },
    { id: "the-visual-crm", label: "03. The Visual CRM" },
    { id: "the-ai-edge", label: "04. The AI Edge" },
    { id: "the-network-effect", label: "05. The Network Effect" }
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="relative min-h-screen selection:bg-brand-red/30 selection:text-text-main font-sans flex flex-col">
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-brand-red origin-left z-[100] shadow-[0_0_10px_rgba(196,30,30,0.8)]"
        style={{ scaleX: scrollYProgress }}
      />

      {mounted && <EtherealDust isLightMode={isLightMode} />}

      <motion.nav
        initial={{ y: -100, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        className="fixed top-6 left-1/2 z-50 flex items-center justify-between rounded-full px-3 py-2 backdrop-blur-[24px] bg-[#0f172a14] dark:bg-white/[0.03] border border-[#0f172a1f] dark:border-white/[0.08] w-[90%] max-w-4xl hover:-translate-y-[2px] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        <div className="flex items-center px-3">
          <Link href="/">
            <OutsauceLogo className="h-6 cursor-pointer" />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-text-muted">
          <Link href="/" className="group relative hover:text-text-main transition-colors py-1">
            Home
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-red scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </Link>
          <Link href="/#features" className="group relative hover:text-text-main transition-colors py-1">
            Features
          </Link>
          <Link href="/#use-cases" className="group relative hover:text-text-main transition-colors py-1">
            Use Cases
          </Link>
          <Link href="/#pricing" className="group relative hover:text-text-main transition-colors py-1">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(isLightMode ? "dark" : "light")}
              className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          )}
          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1 hidden sm:block" />
          <Link href="/login" className="hidden sm:block text-[13px] font-medium text-text-main hover:text-brand-red transition-colors px-2">
            Log in
          </Link>
          <Link href="/signup">
            <Button className="h-8 px-4 text-[13px] rounded-full bg-brand-red hover:bg-brand-red/90 text-white font-semibold border-none shadow-[0_0_20px_rgba(196,30,30,0.3)] hover:shadow-[0_0_30px_rgba(196,30,30,0.5)] transition-all duration-300 hover:scale-105">
              Get Started
            </Button>
          </Link>
        </div>
      </motion.nav>

      <header className="relative z-10 pt-40 pb-20 px-6 max-w-5xl mx-auto text-center border-b border-black/10 dark:border-white/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <Link href="/">
            <Button variant="outline" className="rounded-full gap-2 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-text-main transition-colors h-10 px-5 font-semibold text-sm">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-brand-red font-bold tracking-widest uppercase text-sm mb-6"
        >
          The Outsauce Manifesto
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-text-main mb-8 leading-[1.1]"
        >
          Rethinking the way the world <br className="hidden md:block" />
          sources opportunities.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-text-muted font-medium max-w-3xl mx-auto leading-relaxed"
        >
          A deep dive into the engineering, design, and philosophy behind the platform that automates your career growth.
        </motion.p>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-20 flex flex-col lg:flex-row gap-16 lg:gap-24">

        <aside className="lg:w-1/4 hidden lg:block">
          <div className="sticky top-32 h-[calc(100vh-10rem)] overflow-y-auto pr-4 pb-10 custom-scrollbar">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-6">Contents</h4>
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => scrollToSection(e, link.id)}
                  className={`text-sm font-medium transition-colors relative pl-4 ${
                    activeSection === link.id 
                      ? "text-brand-red" 
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  {activeSection === link.id && (
                    <motion.span
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-brand-red"
                    />
                  )}
                  {link.label}
                </a>
              ))}
            </nav>
            
            <div className="mt-12 p-6 rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 backdrop-blur-sm">
              <p className="text-sm text-text-muted mb-4 font-medium">Ready to stop searching manually?</p>
              <Link href="/signup">
                <Button className="w-full rounded-full bg-text-main hover:bg-text-main/90 text-background font-semibold transition-transform hover:scale-105">
                  Try for Free
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        <div className="lg:w-3/4 max-w-3xl">
          <article className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-text-main prose-p:text-text-muted prose-p:leading-[1.8] prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline">

            <section id="the-broken-market" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-extrabold mb-6 text-text-main">01. The Broken Market</h2>
              <p className="text-lg text-text-muted leading-relaxed mb-6 font-medium">
                The modern job market and freelance economy are fundamentally fractured. If you are a professional looking for your next big opportunity—whether it is a full-time role or a contract gig—you are likely forced to juggle multiple identities across LinkedIn, Upwork, Fiverr, and Reddit.
              </p>
              <p className="text-lg text-text-muted leading-relaxed mb-8 font-medium">
                You spend hours manually executing the same searches, filtering through irrelevant noise, and keeping 15 browser tabs open just to ensure you do not miss a lead. 
              </p>

              <div className="my-10 p-8 rounded-3xl bg-white/80 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-lg relative overflow-hidden backdrop-blur-md">
                <Quote className="absolute top-4 left-4 h-24 w-24 text-black/5 dark:text-white/5 -z-10 transform -rotate-12" />
                <p className="text-xl md:text-2xl font-bold text-text-main leading-snug italic relative z-10">
                  "Professionals are spending 60% of their time searching for work, and only 40% actually doing it. The system isn't designed for efficiency; it's designed to keep you on their platforms."
                </p>
              </div>

              <p className="text-lg text-text-muted leading-relaxed mb-6 font-medium">
                We realized that the solution wasn't to build another job board. The solution was to build an aggregation engine that brings the entire internet to your dashboard. Outsauce was created to automate the painful, repetitive task of opportunity discovery.
              </p>
            </section>

            <section id="the-architecture" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-extrabold mb-6 text-text-main">02. The Architecture of Outsauce</h2>
              <p className="text-lg text-text-muted leading-relaxed mb-6 font-medium">
                Under the hood, Outsauce is powered by a robust three-tier architecture designed for massive concurrency. At its core is our <strong>Multi-Platform Hunting Engine</strong>.
              </p>
              <p className="text-lg text-text-muted leading-relaxed mb-8 font-medium">
                Instead of running fragile, client-side scripts, we orchestrate headless browsers and API aggregators using <strong>n8n</strong>—a powerful workflow automation tool. When you configure a "Hunt," you define your target keywords, salary expectations, and geographic locations. The Outsauce NestJS backend immediately dispatches a webhook to n8n, which spawns concurrent runners targeting LinkedIn, Upwork, and Reddit simultaneously.
              </p>

              <div className="my-12 p-8 rounded-3xl bg-brand-navy dark:bg-black/80 border border-brand-red/20 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="flex flex-col gap-4 text-sm font-mono relative z-10">
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <span className="text-emerald-400">POST /api/hunts</span>
                    <span className="text-slate-400">Next.js Frontend</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-px h-6 bg-white/20"></div>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                    <span className="text-blue-400">Webhook Dispatch</span>
                    <span className="text-slate-400">NestJS Backend</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-px h-6 bg-white/20"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-brand-red/30 text-center text-white">LinkedIn</div>
                    <div className="bg-white/5 p-4 rounded-xl border border-brand-red/30 text-center text-white">Upwork</div>
                    <div className="bg-white/5 p-4 rounded-xl border border-brand-red/30 text-center text-white">Reddit</div>
                  </div>
                </div>
              </div>

              <p className="text-lg text-text-muted leading-relaxed mb-6 font-medium">
                The results stream back in real-time via Supabase WebSockets, bypassing the need for manual page refreshes. You get raw, structured data representing the best opportunities on the internet, localized instantly to your dashboard.
              </p>
            </section>

            <section id="the-visual-crm" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-extrabold mb-6 text-text-main">03. Beyond the Spreadsheet (The CRM)</h2>
              <p className="text-lg text-text-muted leading-relaxed mb-6 font-medium">
                Finding the lead is only 10% of the battle. Organizing, tracking, and following up dictates your actual conversion rate. Historically, freelancers and recruiters default to Excel or Notion—static grids that require manual maintenance.
              </p>
              <p className="text-lg text-text-muted leading-relaxed mb-6 font-medium">
                Outsauce introduces a deeply integrated <strong>Visual CRM</strong>. When an interesting gig flows in from the hunter, one click saves it to your database as a "Lead."
              </p>

              <ul className="space-y-4 mb-8 text-lg text-text-muted font-medium list-none p-0">
                <li className="flex items-start gap-4">
                  <div className="h-6 w-6 mt-1 rounded-full bg-brand-red/20 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-brand-red"></div>
                  </div>
                  <span><strong>Pipelines:</strong> Move leads seamlessly from <em>New</em> → <em>Contacted</em> → <em>In Progress</em> → <em>Closed</em>.</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-6 w-6 mt-1 rounded-full bg-brand-red/20 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-brand-red"></div>
                  </div>
                  <span><strong>Tags:</strong> Color-code your opportunities. Keep your React contracts separate from your UI/UX consulting gigs.</span>
                </li>
                <li className="flex items-start gap-4">
                  <div className="h-6 w-6 mt-1 rounded-full bg-brand-red/20 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-brand-red"></div>
                  </div>
                  <span><strong>Analytics:</strong> Because it's stored in a structured PostgreSQL database, we can provide actual insights into your application-to-hire ratio.</span>
                </li>
              </ul>
            </section>

            <section id="the-ai-edge" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-extrabold mb-6 text-text-main">04. The AI Edge</h2>
              <p className="text-lg text-text-muted leading-relaxed mb-6 font-medium">
                The biggest bottleneck in securing high-quality work is the application process itself. Generic cover letters are instantly rejected by clients and ATS systems alike. Crafting a hyper-personalized response for every gig is mentally exhausting.
              </p>
              <p className="text-lg text-text-muted leading-relaxed mb-8 font-medium">
                We integrated OpenAI directly into the lead management pipeline. Our prompt architecture doesn't just ask an LLM to "write a cover letter." Instead, Outsauce passes a heavily structured payload containing:
              </p>

              <div className="bg-white/80 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl p-6 mb-8 font-mono text-sm text-text-main backdrop-blur-md">
                <span className="text-text-muted block mb-2">// The payload sent to the LLM</span>
                {`{`} <br/>
                &nbsp;&nbsp;<span className="text-blue-500">"target_role"</span>: <span className="text-emerald-500">"Senior Next.js Developer"</span>, <br/>
                &nbsp;&nbsp;<span className="text-blue-500">"platform_tone"</span>: <span className="text-emerald-500">"Upwork (Direct, Results-Oriented)"</span>, <br/>
                &nbsp;&nbsp;<span className="text-blue-500">"user_profile"</span>: <span className="text-purple-500">UserSkillsArray</span>, <br/>
                &nbsp;&nbsp;<span className="text-blue-500">"job_description"</span>: <span className="text-purple-500">HuntedGigText</span> <br/>
                {`}`}
              </div>

              <p className="text-lg text-text-muted leading-relaxed mb-6 font-medium">
                The result is a cover letter, bio, or proposal that perfectly highlights your specific skills relevant *only* to that specific job post. You review it, tweak it, and send it out in seconds.
              </p>
            </section>

            <section id="the-network-effect" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-extrabold mb-6 text-text-main">05. The Network Effect</h2>
              <p className="text-lg text-text-muted leading-relaxed mb-6 font-medium">
                Cold outreach is dying. Random connection requests on legacy platforms yield incredibly low response rates because they lack context and mutual alignment.
              </p>
              <p className="text-lg text-text-muted leading-relaxed mb-6 font-medium">
                Outsauce is building the future of professional matching. By leveraging PostgreSQL GIN indexes on user skill and interest arrays, our backend constantly calculates a **Match Score** between you and other users on the platform. 
              </p>
              <p className="text-lg text-text-muted leading-relaxed mb-12 font-medium">
                When you connect with someone on Outsauce, it is because the algorithm has mathematically determined you have overlapping goals, complementary skills, or mutual industry interests. This enables highly relevant, frictionless professional networking with integrated real-time chat.
              </p>
            </section>

          </article>

          <div className="my-20 p-12 rounded-[3rem] bg-gradient-to-br from-brand-navy to-black dark:from-white/5 dark:to-transparent border border-white/10 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-brand-red/5" />
            <h3 className="text-3xl font-bold text-white mb-4 relative z-10">Stop searching. Start closing.</h3>
            <p className="text-slate-300 text-lg mb-8 max-w-lg mx-auto relative z-10">Join professionals who have completely automated their lead generation and career growth.</p>
            <Link href="/signup" className="relative z-10">
              <Button size="lg" className="rounded-full bg-brand-red hover:bg-brand-red/90 text-white h-14 px-10 text-lg font-bold shadow-[0_0_30px_rgba(196,30,30,0.4)] hover:shadow-[0_0_50px_rgba(196,30,30,0.6)] hover:scale-105 transition-all duration-300">
                Create Your Account
              </Button>
            </Link>
          </div>

        </div>
      </main>

      <footer className="mt-auto border-t border-black/[0.08] dark:border-white/[0.08] relative z-10 bg-bg-main-light/80 dark:bg-brand-navy/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center text-text-main">
            <OutsauceLogo className="h-7" />
          </div>

          <div className="flex gap-8 text-sm font-medium text-text-muted">
            <Link href="/privacy" className="hover:text-text-main transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-text-main transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-text-main transition-colors">Contact</Link>
          </div>

          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} Outsauce. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
