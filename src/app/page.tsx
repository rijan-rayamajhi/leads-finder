'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LeadsTable } from '@/components/leads-table';
import { Lead, PipelineResult } from '@/types/lead';
import Image from 'next/image';
import { 
  Search, 
  Loader2, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Menu, 
  X, 
  Database 
} from 'lucide-react';

const SUGGESTIONS = [
  'salons in mumbai',
  'dentists in bangalore',
  'gyms in delhi',
  'coaching classes in pune',
  'real estate agents in hyderabad',
];

export default function LeadGenDashboard() {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [intent, setIntent] = useState<'high' | 'low' | 'all'>('high');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [callingId, setCallingId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Pipeline result state
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    
    // Schedule loading state safely on next tick to avoid synchronous setState warnings inside effect
    const timer = setTimeout(() => {
      if (active) setIsLoadingLeads(true);
    }, 0);

    fetch(`/api/leads?showAll=${showAll}&intent=${intent}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch leads from server.');
        return res.json();
      })
      .then((data) => {
        if (active) {
          setLeads(data);
          setErrorText(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const error = err as Error;
          setErrorText(error.message || 'Something went wrong fetching leads.');
        }
      })
      .finally(() => {
        clearTimeout(timer);
        if (active) setIsLoadingLeads(false);
      });

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [showAll, intent, refreshTrigger]);

  // Run scraping pipeline
  const handleRunPipeline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isRunningPipeline) return;

    setIsRunningPipeline(true);
    setPipelineResult(null);
    setErrorText(null);

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Pipeline execution failed.');
      }

      const result: PipelineResult = await res.json();
      setPipelineResult(result);
      
      // Refresh current view of leads by incrementing trigger
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorText(error.message || 'Something went wrong. Try again.');
    } finally {
      setIsRunningPipeline(false);
    }
  };

  // Mark a lead as called (optimistic update)
  const handleMarkCalled = async (id: number) => {
    setCallingId(id);
    
    // Store original list in case we need to roll back
    const originalLeads = [...leads];
    
    // Optimistic Update: If not in 'showAll' mode, filter it out immediately.
    // If in 'showAll' mode, mark it as called in the local list.
    if (!showAll) {
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    } else {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id ? { ...lead, called: true, called_at: new Date().toISOString() } : lead
        )
      );
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error('Could not update lead called status.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      // Rollback optimistic update
      setLeads(originalLeads);
      setErrorText(error.message || 'Could not update lead called status. Refreshed table.');
    } finally {
      setCallingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-sans antialiased text-foreground">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col fixed inset-y-0 left-0 z-40">
        <div className="h-16 border-b border-border flex items-center px-6 gap-2.5 shrink-0 bg-card">
          <Image src="/logo.png" alt="Leads Finder" width={28} height={28} className="w-7 h-7 rounded-lg object-contain shadow-sm border border-border/50" />
          <span className="text-sm font-bold text-foreground tracking-tight">Leads Finder</span>
        </div>
        
        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Pipeline
          </div>
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary transition-all"
          >
            <Database className="w-4 h-4 shrink-0" />
            Prospects
          </button>
        </nav>
      </aside>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer Panel */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 flex flex-col md:hidden transition-transform duration-300 ease-in-out transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0 bg-card">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Leads Finder" width={28} height={28} className="w-7 h-7 rounded-lg object-contain shadow-sm border border-border/50" />
            <span className="text-sm font-bold text-foreground tracking-tight">Leads Finder</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Pipeline
          </div>
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary transition-all"
          >
            <Database className="w-4 h-4 shrink-0" />
            Prospects
          </button>
        </nav>
      </aside>

      {/* Main Page Workspace Layout Container */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-64">
        {/* Dashboard Top Header */}
        <header className="bg-card border-b sticky top-0 z-30 shadow-sm shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground md:hidden transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="Leads Finder" width={24} height={24} className="md:hidden w-6 h-6 rounded-md object-contain shadow-sm border border-border/50" />
                <h1 className="text-sm font-bold text-foreground leading-none">Prospects</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content Space */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full space-y-6">
          {/* Dashboard Dynamic Real-time Stats */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Total Prospects</span>
              <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{leads.length}</span>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Pending Calls</span>
              <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{leads.filter(l => !l.called).length}</span>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Hot Prospects</span>
              <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{leads.filter(l => l.score >= 70).length}</span>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Avg Quality</span>
              <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">
                {leads.length > 0 ? Math.round(leads.reduce((acc, l) => acc + l.score, 0) / leads.length) : 0}
              </span>
            </div>
          </section>

          {/* Search Panel Card */}
          <section className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
            <form onSubmit={handleRunPipeline} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search-input"
                    type="text"
                    placeholder="Search prospects (e.g. salons in mumbai...)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isRunningPipeline}
                    className="pl-10 h-10 md:h-11 bg-background border-input text-foreground focus-visible:ring-ring"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isRunningPipeline || !query.trim()}
                  className="h-10 md:h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-sm rounded-md transition-all w-full sm:w-auto"
                >
                  {isRunningPipeline ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Scraping…
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Scrape
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Search Suggestions */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground mr-1">Suggestions:</span>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  disabled={isRunningPipeline}
                  className="px-2.5 py-1 text-xs bg-muted hover:bg-muted/80 active:bg-muted text-muted-foreground rounded-md transition-all font-medium border border-border"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>

          {/* Dynamic Alerts (Error Banners) */}
          {errorText && (
            <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{errorText}</p>
            </div>
          )}

          {/* Pipeline Status Summary Card */}
          {pipelineResult && (
            <section className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 sm:p-5 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pipeline Run Complete</span>
              </div>
              
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                Run complete: <span className="font-bold text-foreground">{pipelineResult.scraped}</span> scraped &rarr;{' '}
                <span className="font-bold text-foreground">{pipelineResult.filtered}</span> filtered &rarr;{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{pipelineResult.stored}</span> stored{' '}
                <span className="text-xs text-muted-foreground font-normal">
                  ({pipelineResult.skipped_dedup} duplicate, {pipelineResult.skipped_score} low score)
                </span>
              </p>
            </section>
          )}

          {/* Leads Table Container */}
          <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-md sm:text-base font-bold text-foreground leading-none">Prospects Database</h2>
                {intent === 'low' && (
                  <span className="text-[11px] text-muted-foreground font-medium mt-1.5 flex items-center gap-1.5">
                    <span>ℹ️</span> Low intent prospects are automatically deleted after 7 days to keep your database clean.
                  </span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                {/* Quality Intent Filter */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border flex-1 sm:flex-initial">
                  <button
                    onClick={() => setIntent('high')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      intent === 'high'
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    High Intent
                  </button>
                  <button
                    onClick={() => setIntent('low')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      intent === 'low'
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Low Intent
                  </button>
                  <button
                    onClick={() => setIntent('all')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      intent === 'all'
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All
                  </button>
                </div>

                {/* Show Called Toggle Option */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border flex-1 sm:flex-initial">
                  <button
                    onClick={() => setShowAll(false)}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      !showAll 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Uncalled
                  </button>
                  <button
                    onClick={() => setShowAll(true)}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      showAll 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All Status
                  </button>
                </div>
              </div>
            </div>

            <div className="p-0">
              <LeadsTable
                leads={leads}
                onMarkCalled={handleMarkCalled}
                isLoading={isLoadingLeads}
                callingId={callingId}
              />
            </div>
          </section>
        </main>

        {/* Integrated Footer */}
        <footer className="bg-card border-t border-border py-4 text-center text-[10px] text-muted-foreground shrink-0 mt-auto">
          <div className="max-w-7xl mx-auto px-4">
            Leads Finder &copy; {new Date().getFullYear()}.
          </div>
        </footer>
      </div>
    </div>
  );
}
