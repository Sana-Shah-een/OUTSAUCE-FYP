"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import { EtherealDust } from "../../components/EtherealDust";
import { OutsauceLogo } from "../../components/OutsauceLogo";
import { VisualDemo } from "../../components/VisualDemo";
import { Button } from "../../components/ui/button";
import {
  ArrowRight,
  Search,
  Sparkles,
  Database,
  MessageSquare,
  Sun,
  Moon,
  Target,
  Briefcase,
  Layers,
  CheckCircle2,
  Check,
  Zap,
  Users,
  Monitor,
  XCircle,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } 
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const GithubIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" />
  </svg>
);

const PricingCard = ({ plan, description, price, features, buttonText, recommended, className }: any) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`group relative rounded-[2rem] p-7 flex flex-col hover:-translate-y-[5px] hover:border-brand-red/50 hover:shadow-[0_0_30px_rgba(196,30,30,0.1)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] backdrop-blur-md border ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] overflow-hidden">
        <div
          className="absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(196,30,30,0.12), transparent 40%)`,
          }}
        />
      </div>
      {recommended && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-red text-white px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-lg z-20">RECOMMENDED</div>
      )}
      <div className="relative z-10 flex flex-col flex-1">
        <h3 className={`text-xl font-bold mb-2 ${recommended ? 'text-white dark:text-brand-navy' : 'text-text-main'}`}>{plan}</h3>
        <p className={`mb-5 text-sm ${recommended ? 'text-slate-300 dark:text-slate-600' : 'text-text-muted'}`}>{description}</p>
        <div className="mb-5"><span className={`text-4xl font-extrabold ${recommended ? 'text-white dark:text-brand-navy' : 'text-text-main'}`}>{price}</span><span className={`text-sm ${recommended ? 'text-slate-300 dark:text-slate-600' : 'text-text-muted'}`}>/mo</span></div>
        <ul className="space-y-3 mb-8">
          {features.map((feature: string, i: number) => (
            <li key={i} className="flex items-center text-sm">
              <Check className={`h-4 w-4 mr-3 flex-shrink-0 ${recommended ? 'text-brand-red dark:text-brand-red' : 'text-brand-red'}`} />
              <span className={recommended ? 'text-slate-200 dark:text-slate-700' : 'text-text-muted'}>{feature}</span>
            </li>
          ))}
        </ul>
        <Button className={`mt-auto w-full rounded-full transition-transform hover:scale-105 h-11 font-semibold text-[15px] ${
          recommended 
            ? 'bg-brand-red hover:bg-brand-red/90 text-white shadow-[0_0_20px_rgba(196,30,30,0.4)] hover:shadow-[0_0_30px_rgba(196,30,30,0.6)]' 
            : 'bg-text-main hover:bg-text-main/90 text-background shadow-md'
        }`}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

const BentoCard = ({ title, description, icon: Icon, className = "" }: any) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      variants={fadeIn}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-[32px] p-8 bg-white/90 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] hover:-translate-y-[5px] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] backdrop-blur-md flex flex-col ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[32px] opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(196,30,30,0.12), transparent 40%)`,
        }}
      />
      <div className="relative z-10 flex flex-col flex-1">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red ring-1 ring-brand-red/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-xl font-bold tracking-tight text-text-main">
          {title}
        </h3>
        <p className="text-text-muted leading-relaxed text-base flex-grow">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-black/10 dark:border-white/10 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full py-5 flex justify-between items-center text-left focus:outline-none group"
      >
        <span className="text-lg font-semibold text-text-main group-hover:text-brand-red transition-colors">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-5 w-5 text-text-muted group-hover:text-brand-red transition-colors" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <p className="pb-5 text-text-muted text-base leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
};

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLightMode = theme === "light";

  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-brand-red/30 selection:text-text-main">
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
          <OutsauceLogo className="h-6" />
        </div>

        <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-text-muted">
          <Link href="#features" className="group relative hover:text-text-main transition-colors py-1">
            Features
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-red scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </Link>
          <Link href="#use-cases" className="group relative hover:text-text-main transition-colors py-1">
            Use Cases
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-red scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </Link>
          <Link href="#how-it-works" className="group relative hover:text-text-main transition-colors py-1">
            How it Works
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-red scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </Link>
          <Link href="#pricing" className="group relative hover:text-text-main transition-colors py-1">
            Pricing
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-red scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </Link>
          <Link href="#faq" className="group relative hover:text-text-main transition-colors py-1">
            FAQ
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-red scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
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
          <Link href="/signup" className="hidden sm:block">
            <Button className="h-8 px-4 text-[13px] rounded-full bg-brand-red hover:bg-brand-red/90 text-white font-semibold border-none shadow-[0_0_20px_rgba(196,30,30,0.3)] hover:shadow-[0_0_30px_rgba(196,30,30,0.5)] transition-all duration-300 hover:scale-105">
              Get Started
            </Button>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-full text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors ml-1"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-bg-main-light dark:bg-brand-navy z-[101] border-l border-black/10 dark:border-white/10 shadow-2xl flex flex-col md:hidden"
            >
              <div className="p-6 flex justify-between items-center border-b border-black/5 dark:border-white/5">
                <OutsauceLogo className="h-6" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
                <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-text-main hover:text-brand-red transition-colors">Features</Link>
                <Link href="#use-cases" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-text-main hover:text-brand-red transition-colors">Use Cases</Link>
                <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-text-main hover:text-brand-red transition-colors">How it Works</Link>
                <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-text-main hover:text-brand-red transition-colors">Pricing</Link>
                <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-text-main hover:text-brand-red transition-colors">FAQ</Link>
                <Link href="/learn-more" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-text-main hover:text-brand-red transition-colors">The Manifesto</Link>
              </div>
              <div className="p-6 border-t border-black/5 dark:border-white/5 flex flex-col gap-4">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full h-12 text-base font-semibold border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-text-main transition-colors">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full rounded-full bg-brand-red hover:bg-brand-red/90 text-white shadow-[0_0_20px_rgba(196,30,30,0.3)] hover:shadow-[0_0_30px_rgba(196,30,30,0.5)] border-none h-12 text-base font-semibold transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 pt-32 pb-16 px-6 sm:px-12 mx-auto max-w-7xl">
        <section className="flex flex-col items-center text-center mt-6 md:mt-12 mb-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl flex flex-col items-center"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red/10 text-brand-red text-xs font-semibold mb-6 ring-1 ring-brand-red/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Outsource your opportunity hunt</span>
            </motion.div>
            
            <motion.h1
              variants={fadeIn}
              className="text-4xl sm:text-6xl font-[800] tracking-[-0.04em] text-text-main leading-[1.1] mb-6"
            >
              The Smartest Way to <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-[#FF4D4D]">
                Source Opportunities.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-lg text-text-muted max-w-2xl mb-10 font-medium leading-relaxed"
            >
              Discover gigs, manage leads, and generate AI-tailored applications across LinkedIn, Upwork, and Fiverr. All unified in one beautiful dashboard.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full bg-brand-red text-white hover:bg-brand-red/90 shadow-[0_0_20px_rgba(196,30,30,0.3)] hover:shadow-[0_0_30px_rgba(196,30,30,0.5)] border-none h-12 px-8 text-base font-semibold hover:scale-105 transition-all duration-300">
                  Start for free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/learn-more" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-12 px-8 text-base font-semibold bg-black/5 dark:bg-white/5 border-none hover:bg-black/10 dark:hover:bg-white/10 text-text-main transition-colors">
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        <section id="features" className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tight text-text-main mb-3">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-lg text-text-muted">
              A comprehensive toolkit engineered for modern professionals.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pt-4 pb-8 -mx-6 px-[12.5vw] md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible hide-scrollbar items-stretch"
          >
            <BentoCard
              title="Multi-Platform Hunting"
              description="Configure highly targeted hunts across LinkedIn, Upwork, Fiverr, and Reddit. Monitor progress in real-time."
              icon={Search}
              className="min-w-[75vw] snap-center md:min-w-0 md:col-span-2 lg:col-span-2"
            />
            <BentoCard
              title="AI Content Engine"
              description="Automatically generate platform-optimized bios, resumes, cover letters, and gig descriptions."
              icon={Sparkles}
              className="min-w-[75vw] snap-center md:min-w-0"
            />
            <BentoCard
              title="Smart Lead CRM"
              description="Organize your hunt results into visual pipelines. Tag and track every lead to closure."
              icon={Database}
              className="min-w-[75vw] snap-center md:min-w-0"
            />
            <BentoCard
              title="Professional Networking"
              description="Connect with peers using our interest-based matching algorithm and chat in real-time."
              icon={MessageSquare}
              className="min-w-[75vw] snap-center md:min-w-0"
            />
            <BentoCard
              title="Unified Dashboard"
              description="Stop juggling 10 tabs. See your pipelines, messages, and hunt results in one premium interface."
              icon={Layers}
              className="min-w-[75vw] snap-center md:min-w-0 md:col-span-2 lg:col-span-1"
            />
          </motion.div>
        </section>

        <section id="use-cases" className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-red/5 to-transparent pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 relative z-10"
          >
            <h2 className="text-3xl font-bold tracking-tight text-text-main mb-3">
              Built for every kind of hustle.
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Whether you're finding your next gig, or sourcing the perfect candidate.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pt-4 pb-8 -mx-6 px-[12.5vw] md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible relative z-10 hide-scrollbar items-stretch"
          >
            <motion.div variants={fadeIn} className="min-w-[75vw] snap-center md:min-w-0 flex flex-col group p-8 rounded-[2rem] bg-white/90 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] backdrop-blur-md hover:border-brand-red/50 hover:shadow-[0_0_30px_rgba(196,30,30,0.1)] hover:-translate-y-[5px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
              <Monitor className="h-8 w-8 text-brand-red mb-5 flex-shrink-0" />
              <h3 className="text-xl font-bold text-text-main mb-2">Freelancers</h3>
              <p className="text-text-muted leading-relaxed text-base flex-1">Stop refreshing Upwork and Fiverr. Let Outsauce hunt high-paying gigs that match your exact skillset, and auto-generate winning proposals.</p>
            </motion.div>
            <motion.div variants={fadeIn} className="min-w-[75vw] snap-center md:min-w-0 flex flex-col group p-8 rounded-[2rem] bg-white/90 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] backdrop-blur-md hover:border-brand-red/50 hover:shadow-[0_0_30px_rgba(196,30,30,0.1)] hover:-translate-y-[5px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
              <Users className="h-8 w-8 text-brand-red mb-5 flex-shrink-0" />
              <h3 className="text-xl font-bold text-text-main mb-2">Recruiters</h3>
              <p className="text-text-muted leading-relaxed text-base flex-1">Source passive candidates from LinkedIn and Reddit automatically. Build structured talent pipelines in our visual CRM.</p>
            </motion.div>
            <motion.div variants={fadeIn} className="min-w-[75vw] snap-center md:min-w-0 flex flex-col group p-8 rounded-[2rem] bg-white/90 dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] backdrop-blur-md hover:border-brand-red/50 hover:shadow-[0_0_30px_rgba(196,30,30,0.1)] hover:-translate-y-[5px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
              <Briefcase className="h-8 w-8 text-brand-red mb-5 flex-shrink-0" />
              <h3 className="text-xl font-bold text-text-main mb-2">Job Seekers</h3>
              <p className="text-text-muted leading-relaxed text-base flex-1">Track applications across multiple job boards in one place. Generate tailored cover letters for each specific role in seconds.</p>
            </motion.div>
          </motion.div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-text-main mb-4">
                From discovery to hire in three steps.
              </h2>
              <p className="text-lg text-text-muted mb-8">
                Our intuitive workflow is designed to minimize friction and maximize your conversion rate.
              </p>

              <div className="space-y-6">
                {[
                  { title: "Define your criteria", desc: "Set keywords, location, and platform targets.", icon: Target },
                  { title: "Let the engine hunt", desc: "Our n8n-powered backend gathers high-quality leads.", icon: Zap },
                  { title: "Apply with AI", desc: "Generate tailored cover letters and reach out instantly.", icon: Briefcase }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-text-main">{step.title}</h4>
                      <p className="text-text-muted text-base mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-square md:aspect-video lg:aspect-square rounded-[3rem] border-2 border-black/[0.08] dark:border-white/[0.12] bg-white/90 dark:bg-white/[0.05] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.12),0_0_40px_rgba(196,30,30,0.08)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(196,30,30,0.15)] backdrop-blur-md ring-1 ring-inset ring-white/30 dark:ring-white/5"
            >
              <VisualDemo />
            </motion.div>
          </div>
        </section>


        <section className="py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-[3rem] bg-brand-navy/90 p-10 md:p-16 border border-white/10 relative overflow-hidden backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-red/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-brand-red/10 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-5 relative z-10">
              Your workflow, accelerated.
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8 relative z-10 font-medium">
              Join the new standard for professional discovery. Unparalleled design, uncompromising performance, and everything you need to scale your career.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center relative z-10">
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 className="text-brand-red h-4 w-4" />
                <span className="text-sm md:text-base">Unlimited Hunts (Pro)</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 className="text-brand-red h-4 w-4" />
                <span className="text-sm md:text-base">AI Native</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 className="text-brand-red h-4 w-4" />
                <span className="text-sm md:text-base">Real-time Sync</span>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="pricing" className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tight text-text-main mb-3">
              Simple, transparent pricing.
            </h2>
            <p className="text-lg text-text-muted">
              Choose the plan that fits your scale. No hidden fees.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pt-6 pb-8 -mx-6 px-[12.5vw] md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible max-w-7xl mx-auto items-stretch hide-scrollbar"
          >
            <PricingCard
              plan="Free"
              description="Perfect to test the waters."
              price="$0"
              features={["5 Hunts/mo", "20 Leads/mo", "10 AI Generations"]}
              buttonText="Start Free"
              className="min-w-[75vw] snap-center md:min-w-0 bg-white/90 dark:bg-white/[0.05] border-black/[0.08] dark:border-white/[0.1]"
            />

            <PricingCard
              plan="Starter"
              description="For individual freelancers."
              price="$19"
              features={["50 Hunts/mo", "200 Leads/mo", "100 AI Generations", "Basic Support"]}
              buttonText="Upgrade to Starter"
              className="min-w-[75vw] snap-center md:min-w-0 bg-white/90 dark:bg-white/[0.05] border-black/[0.08] dark:border-white/[0.1]"
            />

            <PricingCard
              plan="Pro"
              description="For serious professionals."
              price="$49"
              features={["Unlimited Hunts", "Unlimited Leads", "Unlimited AI Generations", "Priority Support"]}
              buttonText="Get Pro"
              recommended={true}
              className="min-w-[75vw] snap-center md:min-w-0 bg-brand-navy/90 dark:bg-bg-main-light/95 border-brand-red/30 shadow-[0_0_40px_rgba(196,30,30,0.15)] scale-[1.02]"
            />

            <PricingCard
              plan="Enterprise"
              description="For large agencies & teams."
              price="$99"
              features={["Everything in Pro", "Custom API Access", "Dedicated Account Manager", "Custom Integrations"]}
              buttonText="Contact Sales"
              className="min-w-[75vw] snap-center md:min-w-0 bg-white/90 dark:bg-white/[0.05] border-black/[0.08] dark:border-white/[0.1]"
            />
          </motion.div>
        </section>

        <section id="faq" className="py-20 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tight text-text-main mb-3">
              Frequently Asked Questions
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/90 dark:bg-white/[0.05] rounded-[2rem] p-6 md:p-10 border border-black/[0.08] dark:border-white/[0.1] backdrop-blur-md"
          >
            <FAQItem question="Which platforms do you currently support?" answer="Outsauce currently supports hunting and integration with LinkedIn, Upwork, Fiverr, and Reddit. We are actively working on adding more platforms based on community feedback." />
            <FAQItem question="How does the AI content generation work?" answer="We use advanced LLMs fine-tuned for professional writing. When you select a gig or job lead, the AI analyzes the requirements and your profile to generate a highly tailored cover letter, bio, or proposal." />
            <FAQItem question="Is there a limit on how many leads I can save?" answer="The Free plan allows you to save 20 leads per month. Starter allows 200, while the Pro and Enterprise plans offer unlimited lead storage and organization." />
            <FAQItem question="Can I cancel my subscription at any time?" answer="Yes! You can cancel or change your subscription tier at any time from your billing dashboard. There are no lock-in contracts." />
            <FAQItem question="Do I need any technical knowledge to use the hunter?" answer="Not at all. You simply type in what you're looking for (e.g., 'React Developer, Remote, $100k+') and our automated backend handles the complex hunt process for you." />
          </motion.div>
        </section>

        <section className="py-24 flex flex-col items-center text-center">
          <h2 className="text-4xl font-bold tracking-tight text-text-main mb-5">
            Ready to find your next big thing?
          </h2>
          <p className="text-lg text-text-muted mb-8 max-w-xl">
            Start using Outsauce today and experience the future of professional networking and opportunity discovery.
          </p>
          <Link href="/signup">
            <Button size="lg" className="rounded-full bg-brand-red hover:bg-brand-red/90 text-white h-14 px-8 text-lg font-bold shadow-[0_0_30px_rgba(196,30,30,0.4)] hover:shadow-[0_0_50px_rgba(196,30,30,0.6)] hover:scale-105 transition-all duration-300">
              Get Started for Free
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-black/[0.08] dark:border-white/[0.08] relative z-10 bg-bg-main-light/80 dark:bg-brand-navy/80 backdrop-blur-lg">
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

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}} />
    </div>
  );
}
