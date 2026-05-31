'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  FileText, 
  Star, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Send, 
  Zap, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  MessageSquareCode, 
  Share2, 
  Target,
  ArrowRight,
  Database,
  Globe,
  Award,
  Copy,
  Check
} from 'lucide-react';

// Simulated Leads Data
const MOCK_SCAN_LEADS = {
  'salons': [
    {
      name: 'Bella Spas & Salon',
      city: 'Boston',
      score: 88,
      status: 'No Website',
      reason: 'Business has a 4.7⭐ rating with 89 reviews, but absolutely no active website. Missing out on roughly 350+ organic local search visits every month.',
      phone: '+1 (617) 555-0129',
      value: 1200,
      pitch: "Hi Bella Spas team! I found your highly-rated salon on Google Maps in Boston. I noticed you don't have a website listed, meaning you're losing customers to competitors. I build high-converting mobile websites. Open to a quick chat?"
    },
    {
      name: 'Nail Elegance Studio',
      city: 'Boston',
      score: 94,
      status: 'Website Offline',
      reason: 'Website listed on Google Maps returns a "502 Bad Gateway" server error. Existing customers cannot book or find your hours.',
      phone: '+1 (617) 555-0182',
      value: 1500,
      pitch: "Hello Nail Elegance! I tried visiting your website from Google and noticed it returns a server error. I specialize in restoring broken local business websites. Let's get it fixed this week so you don't lose booking revenues."
    },
    {
      name: 'Glow Hair Bar',
      city: 'Boston',
      score: 79,
      status: 'Outdated & Slow',
      reason: 'Website loads in 7.2s and has no mobile responsiveness. Standard mobile speed is 2.5s. High bounce rates expected.',
      phone: '+1 (617) 555-0199',
      value: 950,
      pitch: "Hi Glow Hair Bar! I visited your site and noticed it takes over 7 seconds to load on mobile. Restructuring it to be mobile-optimized can double your online inquiries. Would you be open to a brief call to see quick fixes?"
    }
  ],
  'dentists': [
    {
      name: 'Downtown Dental Partners',
      city: 'Miami',
      score: 91,
      status: 'No Website',
      reason: 'Premium dental location with 4.8⭐ and 142 reviews, but no website listed. Competitors are bidding on their local keywords.',
      phone: '+1 (305) 555-0211',
      value: 2500,
      pitch: "Hi Downtown Dental! I saw your amazing reviews in Miami but noticed you don't have a website. A simple high-converting page could easily pull in 40+ new high-value appointments monthly. Let's connect!"
    },
    {
      name: 'Elite Orthodontics',
      city: 'Miami',
      score: 87,
      status: 'Website Offline',
      reason: 'Domain name has expired or DNS records are unconfigured. Website is completely blank.',
      phone: '+1 (305) 555-0244',
      value: 3000,
      pitch: "Hello Elite Orthodontics team! I noticed your website domain is currently showing an expired page. I build fast, secure medical/dental websites and can recover your online presence. Let me know if you have 5 minutes."
    },
    {
      name: 'Bright Smiles Miami',
      city: 'Miami',
      score: 76,
      status: 'Outdated & Slow',
      reason: 'No SSL security certificate installed (shows "Not Secure" warning in browser). Mobile layout is broken.',
      phone: '+1 (305) 555-0288',
      value: 1800,
      pitch: "Hi Bright Smiles! Your Google listing is excellent, but your website shows a 'Not Secure' warning, which drives away safety-conscious patients. Let's secure your site and redesign it for high conversions."
    }
  ],
  'gyms': [
    {
      name: 'Iron Temple Fitness',
      city: 'Austin',
      score: 85,
      status: 'No Website',
      reason: 'High organic engagement on Instagram, but zero official website to process gym membership signups or class bookings.',
      phone: '+1 (512) 555-0310',
      value: 1800,
      pitch: "Hi Iron Temple team! Love your gym's energy in Austin. I noticed you don't have a website to automate signups. I can build a clean site with built-in membership forms. Let me know if you're open to a chat."
    },
    {
      name: 'Peak CrossFit Lab',
      city: 'Austin',
      score: 93,
      status: 'Website Offline',
      reason: 'Website returns a "Connection Timed Out" error. Impedes local fitness search discovery.',
      phone: '+1 (512) 555-0331',
      value: 2200,
      pitch: "Hello Peak CrossFit! Your Google page is great, but your website link is currently down. I build secure, fast athletic sites and can get you back online immediately. When is a good time for a 5-minute call?"
    },
    {
      name: 'Core & Cardio Studio',
      city: 'Austin',
      score: 80,
      status: 'Outdated & Slow',
      reason: 'Old static site built in 2016. Page size is 12MB. Take 9.4s to render fully. Broken contact forms.',
      phone: '+1 (512) 555-0355',
      value: 1400,
      pitch: "Hi Core & Cardio! I checked your site on mobile and noticed it's very slow to load (9+ seconds) with broken forms. A modern, lightweight design will double your signup rate. Let's schedule a call to discuss."
    }
  ]
};

export default function LandingPage() {
  // Simulator State
  const [selectedCategory, setSelectedCategory] = useState<'salons' | 'dentists' | 'gyms'>('salons');
  const [customQuery, setCustomQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanResultLeads, setScanResultLeads] = useState<any[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Pricing State
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // FAQ State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Auto-scroll simulation logs
  useEffect(() => {
    if (isScanning && scanStep < 6) {
      const logsSequence = [
        `Connecting to Google Maps API & Places search workers...`,
        `Searching for "${customQuery || (selectedCategory === 'salons' ? 'salons in Boston' : selectedCategory === 'dentists' ? 'dentists in Miami' : 'gyms in Austin')}"...`,
        `Analyzing 45 Google Place business profile markers...`,
        `Running Intelligent Web Crawler & domain resolver audits...`,
        `Evaluating accessibility, SSL security & page load parameters...`,
        `Calculating Lead Intent & SEO marketing opportunity scores...`
      ];

      const timer = setTimeout(() => {
        setScanLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logsSequence[scanStep]}`]);
        setScanStep(prev => prev + 1);
      }, scanStep === 0 ? 300 : 700);

      return () => clearTimeout(timer);
    } else if (isScanning && scanStep === 6) {
      const timer = setTimeout(() => {
        setScanLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Instant Scan Completed! Successfully stored 3 Hot Leads in CRM.`]);
        setScanResultLeads(MOCK_SCAN_LEADS[selectedCategory]);
        setIsScanning(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isScanning, scanStep, selectedCategory, customQuery]);

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (isScanning) return;
    setScanLogs([]);
    setScanResultLeads(null);
    setScanStep(0);
    setIsScanning(true);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const faqs = [
    {
      q: "How does the scraping and auditing process work?",
      a: "Leads Finder interfaces with local directory data on Google Maps and runs an immediate, headless web crawl on every business website found. It programmatically checks if the website resolves, registers errors (like 404, 502, or DNS timeouts), detects if there's no website listed, and calculates performance indicators like mobile speed and SSL certificates."
    },
    {
      q: "Do I need my own Google API keys or proxies?",
      a: "Not at all. Everything is handled out-of-the-box by our hosted scraping clusters. You simply enter a niche and a city, click 'Scrape', and let our background workers generate lists of high-intent prospects."
    },
    {
      q: "What makes a prospect 'High Intent'?",
      a: "Our proprietary Lead Scoring Engine rates opportunities out of 100. High-intent leads (usually scored 80+) are highly-rated, popular businesses that have a significant number of Google reviews, but currently have no website, a completely broken website, or major security flaws. Because they already have organic customers, they are highly motivated to invest in website fixes."
    },
    {
      q: "Can I customize the outreach templates?",
      a: "Yes! In your `/dashboard` CRM panel, you have an Outreach Assistant. Based on whether a lead has 'No active website', a 'Broken website', or an 'Outdated layout', it automatically selects the most effective copywriting templates. You can customize them inside the editor, copy them with a single click, or send them directly via WhatsApp or Email."
    },
    {
      q: "Is there a limit to how many searches I can perform?",
      a: "Limits vary based on your plan. The Starter plan provides 15 monthly scans, the Professional plan includes 75 scans, and the Agency plan offers unlimited scans with priority multi-threaded scraping nodes."
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
            <a href="#interactive-scan" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Live Demo</a>
            <a href="#how-it-works" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#faqs" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">FAQs</a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs font-bold px-4 py-2 hover:bg-muted/60">
                Log In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="text-xs font-bold px-4 h-9 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Launch App <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center relative">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Glassmorphism Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm text-[10px] sm:text-xs font-extrabold text-primary tracking-wide animate-in fade-in duration-500">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>INSTANT WEB AUDITS AND SCRAPER IS ACTIVE</span>
          </div>

          {/* Premium Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.1] animate-in slide-in-from-bottom-3 duration-500">
            Find Local Clients Who Don't Have{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
              Active Websites
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-4 duration-600">
            Scrape directories, detect offline pages instantly, grade opportunities with custom scoring, and launch outreach pitches with a simple CRM dashboard.
          </p>

          {/* Action Callouts */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in slide-in-from-bottom-5 duration-700">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-bold shadow-xl shadow-primary/25 hover:shadow-primary/30 hover:scale-[1.03] transition-all">
                Start Finding Leads Free
              </Button>
            </Link>
            <a href="#interactive-scan">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-semibold border-border hover:bg-muted/40 transition-all">
                Try Live Simulator <Zap className="w-4 h-4 ml-2 text-amber-500 animate-pulse" />
              </Button>
            </a>
          </div>
          
          {/* Rating Badges */}
          <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs font-semibold pt-8 animate-in fade-in duration-800">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Setup in 60 Seconds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>100% Secure Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Scan Simulator Section */}
      <section id="interactive-scan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border/40 relative">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Section Headers */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Experience the Scanning Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Test out our automated website verification crawler. Select a niche to launch a live simulated scan of target prospects.
            </p>
          </div>

          {/* Simulator Console Wrapper */}
          <Card className="border border-border/80 shadow-2xl overflow-hidden rounded-2xl bg-card/60 backdrop-blur-md">
            
            {/* Top Bar resembles MacOS Window Controls */}
            <div className="bg-muted/50 border-b border-border/60 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-[10px] font-bold text-muted-foreground font-mono ml-2">leads-finder-audit-worker.sh</span>
              </div>
              <Badge variant="secondary" className="text-[9px] font-bold tracking-wider uppercase border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Simulator Sandbox
              </Badge>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              
              {/* Category selection */}
              {!isScanning && !scanResultLeads && (
                <form onSubmit={handleStartScan} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Step 1: Choose a local commercial niche
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'salons', title: 'Beauty Salons', count: 'Boston', icon: Sparkles },
                        { id: 'dentists', title: 'Dentists', count: 'Miami', icon: Target },
                        { id: 'gyms', title: 'Fitness Gyms', count: 'Austin', icon: TrendingUp }
                      ].map(cat => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id as any)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-150 ${
                              isSelected
                                ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/5'
                                : 'bg-background hover:bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="text-xs font-bold block">{cat.title}</span>
                            <span className="text-[9px] font-medium text-muted-foreground mt-0.5">{cat.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Search Query Trigger Input */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Step 2: Enter custom keywords or verify search query
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={customQuery}
                          onChange={(e) => setCustomQuery(e.target.value)}
                          placeholder={`Find high-intent ${selectedCategory === 'salons' ? 'salons in Boston' : selectedCategory === 'dentists' ? 'dentists in Miami' : 'gyms in Austin'}...`}
                          className="w-full pl-10 pr-4 h-11 text-xs font-semibold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="h-11 px-6 font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20"
                      >
                        Launch Scan Pipeline <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Live Logging Animation Box */}
              {isScanning && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Running real-time site audit pipeline
                    </span>
                    <span className="text-[10px] font-bold font-mono text-primary">Progress: {Math.round((scanStep / 6) * 100)}%</span>
                  </div>
                  
                  {/* Console Logs Terminal */}
                  <div className="bg-black/90 text-zinc-300 font-mono text-[11px] p-5 rounded-xl space-y-2.5 max-h-56 overflow-y-auto leading-relaxed border border-zinc-800 shadow-inner">
                    {scanLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-100">
                        {idx === scanLogs.length - 1 ? (
                          <>
                            <span className="text-primary font-bold animate-pulse">⚡</span>
                            <span className="text-white font-bold leading-normal">{log}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span className="text-zinc-400 leading-normal">{log}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scraped Results Display Cards */}
              {scanResultLeads && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Scanned leads matching your target criteria
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Showing 3 high opportunity prospects with critical website gaps or non-existent domains.
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setScanResultLeads(null);
                          setScanStep(0);
                        }}
                        className="text-[10px] font-bold h-8 border-border"
                      >
                        Reset Demo
                      </Button>
                      <Link href="/dashboard">
                        <Button
                          size="sm"
                          className="text-[10px] font-bold h-8 bg-primary text-white"
                        >
                          Unlock Full CRM App <Sparkles className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Scraped leads list grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {scanResultLeads.map((lead, idx) => (
                      <Card key={idx} className="border border-border/80 shadow-md hover:shadow-lg transition-all duration-200 bg-background/50 flex flex-col justify-between">
                        
                        <div className="p-4 space-y-3.5">
                          {/* Header name / badge */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-black text-foreground tracking-tight leading-tight line-clamp-1">
                              {lead.name}
                            </h4>
                            <Badge className="text-[9px] font-bold tracking-wider shrink-0 bg-red-500/10 text-red-500 border-red-500/20 uppercase">
                              {lead.status}
                            </Badge>
                          </div>

                          {/* MapPin / Phone contact channels */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{lead.city}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{lead.phone}</span>
                            </div>
                          </div>

                          {/* Opportunities audits info */}
                          <div className="p-3 bg-muted/40 rounded-lg border border-border/50 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Lead Opportunity Score</span>
                              <Badge variant="outline" className="text-[9px] font-bold px-1.5 h-4.5 bg-primary/5 text-primary border-primary/20">
                                {lead.score}/100
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                              {lead.reason}
                            </p>
                          </div>
                        </div>

                        {/* Pitch execution buttons */}
                        <div className="p-3 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-2.5">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Est. Deal Value</span>
                            <span className="text-xs font-black text-foreground">${lead.value}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(lead.pitch, idx)}
                            className="text-[10px] font-bold h-7.5 px-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy Pitch
                              </>
                            )}
                          </Button>
                        </div>

                      </Card>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-muted/20 border-t border-border/40 relative">
        <div className="space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Features Built for Digital Agencies & Freelancers
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Every tool you need to scrape leads, identify site vulnerabilities, structure pitches, and finalize contract redesign projects.
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
                  Query any industry niche and city combination globally. Our engine processes Google Maps profile databases instantly to pull verified leads.
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
                  Runs background crawlers checking if business domains resolve, flags broken DNS servers, audits SSL safety certificates, and evaluates mobile speeds.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border border-border/80 bg-card hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-sm font-extrabold text-foreground">Lead Scoring Intelligence</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Grades opportunities based on total reviews, average ratings, and website deficiencies. Filter immediately for prospects ready to buy.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border border-border/80 bg-card hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <MessageSquareCode className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-sm font-extrabold text-foreground">Built-in CRM & Outreach</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Track deal values, plan follow-up notifications, record phone logs, and open context-aware Whatsapp or mail scripts instantly.
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
              A 3-Step Engine to Land Clients
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Ditch the generic lists. Connect with high-value local prospects whose businesses already generate customer interest, but lack active website pages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Step 1 */}
            <div className="space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-sm text-primary shadow-sm border border-primary/20">
                01
              </div>
              <h3 className="text-sm font-black text-foreground">Scrape and Crawl</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Enter any location and commercial niche (e.g. dentists in Chicago). Background workers pull business listings and audit their live site domains automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-violet-600/10 flex items-center justify-center font-black text-sm text-violet-500 shadow-sm border border-violet-600/20">
                02
              </div>
              <h3 className="text-sm font-black text-foreground">Select and Customize Pitch</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Select high opportunity leads. Review pre-engineered WhatsApp/Email pitches highlighting the precise problem found (e.g. DNS timeout, broken SSL, or no domain link).
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center font-black text-sm text-emerald-500 shadow-sm border border-emerald-500/20">
                03
              </div>
              <h3 className="text-sm font-black text-foreground">Outreach & Close CRM Deals</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Contact owners directly using one-click messaging integrations. Record progress, log follow-up calendars, assign target contract deal values, and monitor won sales.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Calculator Tiers */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-muted/20 border-t border-border/40 relative">
        <div className="space-y-12">
          
          <div className="text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Flexible Plans Built for Growth
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Find clients at your own pace. Switch pricing modes to fit your solo consultancy or full agency outreach needs.
            </p>

            {/* Billing period toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-card border border-border/80">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-primary text-white shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1.5 transition-all ${
                  billingPeriod === 'annual'
                    ? 'bg-primary text-white shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual Save 20%
                <Badge className="bg-emerald-500 text-[8px] h-4 font-bold px-1 select-none text-white border-none">
                  Promo
                </Badge>
              </button>
            </div>
          </div>

          {/* 3 Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Plan 1 */}
            <Card className="border border-border/80 bg-card/60 backdrop-blur-md rounded-2xl flex flex-col justify-between hover:shadow-xl transition-all duration-300">
              <div className="p-6 sm:p-8 space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-foreground">Starter Prospector</h3>
                  <p className="text-xs text-muted-foreground mt-1">Perfect for part-time freelancers.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-black text-foreground">${billingPeriod === 'monthly' ? '29' : '23'}</span>
                  <span className="text-xs text-muted-foreground font-medium ml-1">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground font-medium border-t border-border/50 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>15 Local Market Scans / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Up to 150 Prospect Leads / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Automatic Web Domain Audits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Standard WhatsApp Pitch Templates</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-muted/20 border-t border-border/50">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full text-xs font-bold h-10 border-border hover:bg-muted/40">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Plan 2 - Recommended */}
            <Card className="border-2 border-primary bg-card rounded-2xl flex flex-col justify-between shadow-2xl relative hover:scale-[1.01] transition-all duration-300">
              <div className="absolute top-0 right-6 -translate-y-1/2">
                <Badge className="bg-primary text-white text-[9px] font-bold uppercase tracking-wider border-none px-2.5 py-0.5">
                  Most Popular
                </Badge>
              </div>
              <div className="p-6 sm:p-8 space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                    Agency Professional <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">For active outreach agencies.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-black text-foreground">${billingPeriod === 'monthly' ? '79' : '63'}</span>
                  <span className="text-xs text-muted-foreground font-medium ml-1">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground font-medium border-t border-border/50 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-foreground">75 Local Market Scans / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-foreground">Unlimited Prospect Database Logs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Lead Scoring Grade Analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>WhatsApp + Email Strategy Copier</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Priority background crawler threads</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-muted/20 border-t border-border/50">
                <Link href="/dashboard">
                  <Button className="w-full text-xs font-bold h-10 shadow-lg shadow-primary/10">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Plan 3 */}
            <Card className="border border-border/80 bg-card/60 backdrop-blur-md rounded-2xl flex flex-col justify-between hover:shadow-xl transition-all duration-300">
              <div className="p-6 sm:p-8 space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-foreground">Unlimited Enterprise</h3>
                  <p className="text-xs text-muted-foreground mt-1">For serious consulting teams.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-black text-foreground">${billingPeriod === 'monthly' ? '149' : '119'}</span>
                  <span className="text-xs text-muted-foreground font-medium ml-1">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground font-medium border-t border-border/50 pt-5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Unlimited Market Scans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Unlimited Pipeline Leads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Multi-Threaded Headless Audit Servers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Custom Outreach Pitch Templates Creator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Direct CRM Integrations</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-muted/20 border-t border-border/50">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full text-xs font-bold h-10 border-border hover:bg-muted/40">
                    Contact Enterprise
                  </Button>
                </Link>
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faqs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border/40 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" /> Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Got questions about web verification checks or CRM setups? Find immediate answers right here.
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

      {/* Hero CTA Card Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          
          {/* Decorative design layers */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] rounded-full bg-white/5 blur-[50px]" />
          
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Ready to land your next high-ticket client?
            </h2>
            <p className="text-xs sm:text-sm text-white/80 font-medium max-w-xl mx-auto leading-relaxed">
              Join dozens of solo web designers and developers using Leads Finder to identify offline platforms, pitch solutions in seconds, and close deals effortlessly.
            </p>
            <div className="pt-2">
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-primary hover:bg-white/95 h-12 px-8 text-sm font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Launch Scraping Tool Now
                </Button>
              </Link>
            </div>
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
            The hyper-focused cold outreach system for digital agencies, SEO experts, and web builders. Easily identify offline, broken, or unconfigured pages.
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
