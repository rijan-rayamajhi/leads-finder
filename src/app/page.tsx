'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageSquareCode, 
  ArrowRight,
  Database,
  Globe,
  Award
} from 'lucide-react';

export default function LandingPage() {
  // FAQ State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the scraping and auditing process work?",
      a: "Leads Finder queries local business directories on Google Maps and runs background headless audits on every business website found. It checks if the domain resolves, detects offline errors (like 404, 502, or DNS timeouts), and evaluates mobile usability and SSL security certificates."
    },
    {
      q: "How are lead opportunity scores calculated?",
      a: "Our scoring algorithm evaluates prospects out of 100. High-intent leads (usually scored 80+) are highly rated, popular businesses that already have organic customer engagement (reviews) on Google Maps but lack an active website, have an offline page, or have major security vulnerabilities. These are the highest value digital opportunities."
    },
    {
      q: "How do I trigger custom client outreach?",
      a: "Inside your pipeline CRM panel, click on any prospect to open the Lead Profile. The Outreach Assistant automatically selects the best WhatsApp or email template depending on the audit results (e.g. Broken website vs. No website). You can review, copy, or launch messaging clients instantly."
    },
    {
      q: "Where is the leads data stored?",
      a: "All scraped leads and pipeline stage updates are stored securely in our centralized in-house database. The Prospects database automatically keeps historical logs, while active deals are tracked inside the CRM Sales Pipeline tab."
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">
      
      {/* Decorative Gradient Blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none -z-10" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-20" />

      {/* Global Navigation Header */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-95 transition-opacity">
            <Image src="/logo.png" alt="Leads Finder Logo" width={32} height={32} className="w-8 h-8 rounded-lg object-contain shadow-md border border-border/50" />
            <span className="text-base font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              Leads Finder
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#faqs" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Information & FAQs</a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button size="sm" className="text-xs font-bold px-4 h-9 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Launch App Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center relative">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Glassmorphism Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm text-[10px] sm:text-xs font-extrabold text-primary tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>INTERNAL BUSINESS PIPELINE SCRAPER</span>
          </div>

          {/* Premium Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.1]">
            Identify Local Leads{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
              Without Active Sites
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Verify business details from local search indices, run automatic web presence audits, calculate lead opportunities, and log client communication history inside an integrated Sales CRM.
          </p>

          {/* Action Callouts */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-bold shadow-xl shadow-primary/25 hover:shadow-primary/30 hover:scale-[1.03] transition-all">
                Open App Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {/* Factual System Status Indicators */}
          <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs font-semibold pt-8">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Scraper Engine Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Headless Audit Nodes Operational</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>CRM Database Connected</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-muted/20 border-t border-border/40 relative">
        <div className="space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Integrated System Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Leads Finder combines automated data collection, live web audit services, and prospect tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <Card className="border border-border/80 bg-card hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-extrabold text-foreground">Automated Local Scraping</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Directly search Google Places listings by local keywords. The scraper automatically extracts name, location details, active phones, and reviews.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border border-border/80 bg-card hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-violet-500" />
                </div>
                <h3 className="text-sm font-extrabold text-foreground">Intelligent Site Auditing</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Runs background DNS resolver requests, checks website accessibility status codes, validates SSL security, and evaluates mobile load responsiveness.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border border-border/80 bg-card hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-sm font-extrabold text-foreground">Lead Opportunity Grading</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Grades leads on a 100-point opportunity scale, highlighting active businesses with strong client engagement that lack standard web services.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border border-border/80 bg-card hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <MessageSquareCode className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-sm font-extrabold text-foreground">Integrated Outreach CRM</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Manage active conversations in a pipeline, assign prospective deal values, plan calendars, and copy context-aware email or WhatsApp templates.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* How It Works Timeline Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border/40 relative">
        <div className="space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Lead Identification Pipeline Workflow
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              A straightforward process to collect prospects, review web audits, trigger pitches, and log CRM updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Step 1 */}
            <div className="space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-sm text-primary shadow-sm border border-primary/20">
                01
              </div>
              <h3 className="text-sm font-black text-foreground">Scrape and Validate</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Input your target local niche and city. The scraper searches directories and runs automated checks to flag broken or non-existent web pages.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-violet-600/10 flex items-center justify-center font-black text-sm text-violet-500 shadow-sm border border-violet-600/20">
                02
              </div>
              <h3 className="text-sm font-black text-foreground">Generate Targeted Pitch</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Filter prospects with high opportunity scores. Open the details modal to review outreach scripts generated dynamically based on the verified site bugs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center font-black text-sm text-emerald-500 shadow-sm border border-emerald-500/20">
                03
              </div>
              <h3 className="text-sm font-black text-foreground">Track CRM Pipeline Stages</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Contact owners directly using fast communication channels. Log active deals, record conversation histories, calendar call reminders, and track closed won revenues.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faqs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border/40 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" /> Reference & Documentation
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Guidelines and operational reference information for the Leads Finder platform.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-border/80 rounded-xl bg-card/40 backdrop-blur-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-muted/30 transition-all"
                  >
                    <span className="text-xs sm:text-sm font-extrabold text-foreground pr-4">
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-muted-foreground leading-relaxed font-medium border-t border-border/40 pt-3 animate-in slide-in-from-top-1 duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Styled Footer */}
      <footer className="border-t border-border/60 bg-muted/20 py-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 justify-center hover:opacity-95 transition-all">
            <Image src="/logo.png" alt="Leads Finder Logo" width={28} height={28} className="w-7 h-7 rounded-lg object-contain border border-border/50" />
            <span className="text-sm font-extrabold tracking-tight text-foreground">
              Leads Finder
            </span>
          </Link>
          <p className="text-[10px] text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            In-house web verification auditing and client directory scraper platform. Automatically identifies offline, broken, or unconfigured local pages.
          </p>
          <div className="text-[10px] text-muted-foreground/60 border-t border-border/40 pt-6 font-semibold">
            Leads Finder &copy; {new Date().getFullYear()}. All rights reserved. Created in partnership with Antigravity AI.
          </div>
        </div>
      </footer>

    </div>
  );
}

// Simple internal Button Component to avoid conflicts or additional dependencies
function Button({ children, className = '', variant = 'default', size = 'default', type = 'button', ...props }: any) {
  let baseStyles = 'inline-flex items-center justify-center rounded-xl font-bold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none';
  
  let variantStyles = 'bg-primary text-primary-foreground hover:bg-primary/95 hover:shadow-primary/5 active:scale-[0.98]';
  if (variant === 'outline') {
    variantStyles = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-[0.98]';
  } else if (variant === 'ghost') {
    variantStyles = 'hover:bg-accent hover:text-accent-foreground';
  } else if (variant === 'secondary') {
    variantStyles = 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
  }
  
  let sizeStyles = 'h-10 px-4 py-2 text-sm';
  if (size === 'sm') {
    sizeStyles = 'h-9 px-3 text-xs';
  } else if (size === 'lg') {
    sizeStyles = 'h-12 px-8 text-sm';
  } else if (size === 'icon') {
    sizeStyles = 'h-10 w-10';
  }
  
  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
