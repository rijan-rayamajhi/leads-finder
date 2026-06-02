'use client';

import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LeadsTable } from '@/components/leads-table';
import { Lead, PipelineResult } from '@/types/lead';
import { SearchHistoryItem } from '@/types/history';
import { 
  Search, 
  Loader2, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  X, 
  Database,
  History,
  Phone,
  Flame,
  Target,
  Award,
  Sparkles,
  Check,
  Zap
} from 'lucide-react';

const SUGGESTIONS = [
  'salons in mumbai',
  'dentists in bangalore',
  'gyms in delhi',
  'coaching classes in pune',
  'real estate agents in hyderabad',
];

interface LeadsSectionProps {
  prospectsStats: {
    total: number;
    pendingCalls: number;
    hotProspects: number;
    avgQuality: number;
    hotLeads: number;
    avgIntent: number;
  };
  query: string;
  setQuery: (q: string) => void;
  intent: 'high' | 'low' | 'all';
  setIntent: (i: 'high' | 'low' | 'all') => void;
  showAll: boolean;
  setShowAll: (s: boolean) => void;
  tierFilter: string;
  setTierFilter: (t: string) => void;
  nicheFilter: string;
  setNicheFilter: (n: string) => void;
  cityFilter: string;
  setCityFilter: (c: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  searchFilter: string | null;
  setSearchFilter: (s: string | null) => void;
  paginatedLeads: Lead[];
  isLoadingLeads: boolean;
  callingId: number | null;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  totalLeads: number;
  handleMarkCalled: (id: number) => Promise<void>;
  isRunningPipeline: boolean;
  handleRunPipeline: (e: React.FormEvent) => void;
  displayProgress: number;
  currentProgressMessage: string;
  progressLogs: string[];
  pipelineResult: PipelineResult | null;
  errorText: string | null;
  history: SearchHistoryItem[];
  handleClearAllHistory: () => Promise<void> | void;
  handleDeleteHistoryItem: (e: React.MouseEvent, id: number) => Promise<void> | void;
}

export const LeadsSection: React.FC<LeadsSectionProps> = ({
  prospectsStats,
  query,
  setQuery,
  intent,
  setIntent,
  showAll,
  setShowAll,
  tierFilter,
  setTierFilter,
  nicheFilter,
  setNicheFilter,
  cityFilter,
  setCityFilter,
  sortBy,
  setSortBy,
  searchFilter,
  setSearchFilter,
  paginatedLeads,
  isLoadingLeads,
  callingId,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  totalLeads,
  handleMarkCalled,
  isRunningPipeline,
  handleRunPipeline,
  displayProgress,
  currentProgressMessage,
  progressLogs,
  pipelineResult,
  errorText,
  history,
  handleClearAllHistory,
  handleDeleteHistoryItem
}) => {
  const consoleContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll console container when progress logs grow
  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [progressLogs]);

  return (
    <>
      {/* Dashboard Dynamic Real-time Stats Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 animate-in fade-in duration-300">
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-primary shrink-0" /> Total Prospects
            </span>
            <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{prospectsStats.total}</span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Pending Calls
            </span>
            <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{prospectsStats.pendingCalls}</span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0 animate-pulse" /> {"Hot Prospects (>=70)"}
            </span>
            <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{prospectsStats.hotProspects}</span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Avg Quality
            </span>
            <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">
              {prospectsStats.avgQuality}
            </span>
          </CardContent>
        </Card>

        {/* 2 New High-Level Metrics Cards */}
        <Card className="border-rose-500/10 bg-rose-500/[0.02] hover:shadow-md transition-all">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Hot Leads
            </span>
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight block mt-1">
              {prospectsStats.hotLeads}
            </span>
          </CardContent>
        </Card>

        <Card className="border-purple-500/10 bg-purple-500/[0.02] hover:shadow-md transition-all">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-500 shrink-0" /> Avg Intent Score
            </span>
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight block mt-1">
              {prospectsStats.avgIntent}%
            </span>
          </CardContent>
        </Card>
      </section>

      {/* Search Panel Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
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
                  className="pl-10 h-11 lg:h-10"
                />
              </div>
              <Button
                type="submit"
                disabled={isRunningPipeline || !query.trim()}
                className="h-11 lg:h-10 px-5 font-semibold w-full sm:w-auto"
              >
                {isRunningPipeline ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Scraping…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Scrape
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Search Suggestions & History */}
          <div className="mt-4 space-y-4">
            {history.length > 0 && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-muted-foreground" />
                    Recent Searches
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllHistory}
                    className="text-[10px] font-bold text-destructive hover:text-destructive/80 h-6 px-2"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setQuery(item.query)}
                      className="group flex items-center gap-1.5 px-2.5 py-1 bg-muted hover:bg-muted/80 active:bg-muted text-muted-foreground hover:text-foreground rounded-lg text-xs transition-all duration-150 cursor-pointer border border-border"
                    >
                      <span className="font-semibold">{item.query}</span>
                      {item.last_stored > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          {item.last_stored} stored
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                        className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors ml-1"
                        title="Remove from history"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {history.length > 0 ? "Popular Searches" : "Suggestions"}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(suggestion)}
                    disabled={isRunningPipeline}
                    className="text-xs h-7 px-2.5 font-medium"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Alerts (Error Banners) */}
      {errorText && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorText}</AlertDescription>
        </Alert>
      )}

      {/* Real-time Streaming Progress Console */}
      {isRunningPipeline && (
        <Card className="overflow-hidden border-primary/20 bg-primary/[0.01] animate-in fade-in slide-in-from-top-2 duration-300">
          <CardHeader className="bg-muted/40 px-5 py-3 border-b border-border">
            <CardTitle className="text-xs font-bold flex items-center justify-between w-full">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                Scraper Engine Progress
              </span>
              <span className="text-primary font-mono text-sm font-extrabold">{Math.round(displayProgress)}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Animated Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden border border-border/40">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                <span>Initiated</span>
                <span>{Math.round(displayProgress) === 100 ? 'Completed' : 'Auditing Active Candidates'}</span>
              </div>
            </div>

            {/* Active Target display card */}
            {currentProgressMessage ? (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 animate-pulse">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="text-[9px] uppercase font-bold text-primary tracking-wider block">Currently Auditing</span>
                  <span className="text-xs font-bold text-foreground truncate block leading-normal">{currentProgressMessage}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground py-2 text-xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                <span>Connecting to search workers...</span>
              </div>
            )}

            {/* Collapsible Operational Logs */}
            {progressLogs.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <details className="group">
                  <summary className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider cursor-pointer hover:text-foreground list-none flex items-center gap-1.5 select-none focus:outline-none">
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90 text-muted-foreground" />
                    <span>View Operational Logs ({progressLogs.length})</span>
                  </summary>
                  <div 
                    ref={consoleContainerRef}
                    className="mt-3 p-3.5 rounded-xl border border-border/80 bg-muted/20 max-h-40 overflow-y-auto space-y-2.5 font-mono text-[10.5px] leading-relaxed text-muted-foreground"
                  >
                    {progressLogs.map((log, idx) => {
                      const isSkipped = log.startsWith('Skipped') || log.includes('Skipping');
                      if (isSkipped) {
                        return (
                          <div key={idx} className="flex items-center gap-2 text-muted-foreground/60 italic">
                            <span className="bg-muted text-muted-foreground/50 text-[8px] font-bold px-1 py-0.5 rounded border border-border shrink-0">DQ</span>
                            <span className="truncate">{log}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{log}</span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pipeline Status Summary Card */}
      {pipelineResult && (
        <Card className="border-emerald-500/10 bg-emerald-500/5 animate-in fade-in duration-300">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>Pipeline Run Complete</span>
              </div>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px] uppercase tracking-wider border-emerald-500/20">
                Database Synced
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <Card className="shadow-sm">
                <CardContent className="p-3.5 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Scraped Candidates</span>
                  <span className="text-xl font-black text-foreground block mt-1">{pipelineResult.scraped}</span>
                  <span className="text-[9px] text-muted-foreground block mt-1">Google Places search results</span>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-3.5 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Viable Leads</span>
                  <span className="text-xl font-black text-foreground block mt-1">{pipelineResult.filtered}</span>
                  <span className="text-[9px] text-rose-500 font-semibold block mt-1">
                    {pipelineResult.scraped - pipelineResult.filtered} skipped (no phone)
                  </span>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
                <CardContent className="p-3.5 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">Hot Prospects Stored</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">{pipelineResult.stored}</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">Score opportunity &gt; 50</span>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-3.5 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Skipped/Duplicate</span>
                  <span className="text-xl font-black text-foreground block mt-1">
                    {pipelineResult.skipped_dedup + pipelineResult.skipped_score}
                  </span>
                  <span className="text-[9px] text-muted-foreground block mt-1 font-semibold">
                    {pipelineResult.skipped_dedup} dup, {pipelineResult.skipped_score} low score
                  </span>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Scraping Origin Filter Badge */}
      {searchFilter && (
        <Alert className="bg-primary/10 border-primary/20 text-primary animate-in slide-in-from-top-2 duration-200">
          <Filter className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">
            Showing prospects scraped from: <span className="underline font-bold">&ldquo;{searchFilter}&rdquo;</span>
          </AlertTitle>
          <AlertDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchFilter(null);
                setCurrentPage(1);
              }}
              className="text-[10px] font-bold h-6 px-2 mt-1"
            >
              Clear Origin Filter
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Unified Filter & Sort Panel ─── */}
      <Card className="bg-card shadow-sm animate-in fade-in duration-300">
        <CardHeader className="px-4 sm:px-5 pt-4 pb-0 space-y-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              Prospects Database
            </CardTitle>
            <div className="flex items-center gap-2">
              {(tierFilter !== 'all' || nicheFilter !== 'all' || cityFilter !== 'all' || sortBy !== 'final_score' || intent !== 'high' || showAll) && (
                <button
                  onClick={() => {
                    setTierFilter('all');
                    setNicheFilter('all');
                    setCityFilter('all');
                    setSortBy('final_score');
                    setIntent('high');
                    setShowAll(false);
                    setCurrentPage(1);
                  }}
                  className="text-[11px] font-bold text-destructive hover:underline transition-all"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Row 1: Tier + Intent + Called — all as Shadcn Tabs */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {/* Tier Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tier</span>
              <Tabs value={tierFilter} onValueChange={(v) => { setTierFilter(v); setCurrentPage(1); }}>
                <TabsList className="h-9">
                  <TabsTrigger value="all" className="text-xs font-semibold px-3">All</TabsTrigger>
                  <TabsTrigger value="hot" className="text-xs font-semibold px-2.5">🔥 Hot</TabsTrigger>
                  <TabsTrigger value="warm" className="text-xs font-semibold px-2.5">⚡ Warm</TabsTrigger>
                  <TabsTrigger value="nurture" className="text-xs font-semibold px-2.5">🌱 Nurture</TabsTrigger>
                  <TabsTrigger value="cold" className="text-xs font-semibold px-2.5">❄️ Cold</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Intent Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Intent</span>
              <Tabs value={intent} onValueChange={(v) => { setIntent(v as 'high' | 'low' | 'all'); setCurrentPage(1); }}>
                <TabsList className="h-9">
                  <TabsTrigger value="high" className="text-xs font-semibold px-3">High</TabsTrigger>
                  <TabsTrigger value="low" className="text-xs font-semibold px-3">Low</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs font-semibold px-3">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Called Status */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Status</span>
              <Tabs value={showAll ? 'all' : 'uncalled'} onValueChange={(v) => { setShowAll(v === 'all'); setCurrentPage(1); }}>
                <TabsList className="h-9">
                  <TabsTrigger value="uncalled" className="text-xs font-semibold px-3">Uncalled</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs font-semibold px-3">All Status</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Row 2: Niche / City / Sort selects */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 pt-1 border-t border-border/50">
            {/* Niche */}
            <div className="space-y-1 w-full sm:w-44">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Niche</span>
              <Select value={nicheFilter} onValueChange={(v) => { setNicheFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-xs font-semibold">
                  <SelectValue placeholder="All Niches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Niches</SelectItem>
                  <SelectItem value="clinic">Clinics &amp; Medical</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="gym">Gyms &amp; Fitness</SelectItem>
                  <SelectItem value="restaurant">Restaurants &amp; Food</SelectItem>
                  <SelectItem value="consultant">Consultants &amp; Lawyers</SelectItem>
                  <SelectItem value="education">Education &amp; Coaching</SelectItem>
                  <SelectItem value="retail">Shops &amp; Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City Tier */}
            <div className="space-y-1 w-full sm:w-44">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Location</span>
              <Select value={cityFilter} onValueChange={(v) => { setCityFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-xs font-semibold">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="premium">Premium Zones (e.g. Bandra)</SelectItem>
                  <SelectItem value="metro">Metro Cities</SelectItem>
                  <SelectItem value="tier2">Tier-2 Cities</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-1 w-full sm:w-44">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sort by</span>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-xs font-semibold">
                  <SelectValue placeholder="Quality Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="final_score">Quality Score</SelectItem>
                  <SelectItem value="priority_rank">Priority Rank</SelectItem>
                  <SelectItem value="intent_score">Intent Signal</SelectItem>
                  <SelectItem value="digital_gap_score">Digital Gap</SelectItem>
                  <SelectItem value="deal_value">Deal Value</SelectItem>
                  <SelectItem value="created_at">Date Acquired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter summary */}
          {(tierFilter !== 'all' || nicheFilter !== 'all' || cityFilter !== 'all' || sortBy !== 'final_score' || intent !== 'high' || showAll) && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50 animate-in slide-in-from-top-1 duration-150">
              <span className="font-semibold">Active:</span>
              {tierFilter !== 'all' && <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">Tier: {tierFilter.toUpperCase()}</Badge>}
              {intent !== 'high' && <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">Intent: {intent.toUpperCase()}</Badge>}
              {showAll && <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">Status: ALL</Badge>}
              {nicheFilter !== 'all' && <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">Niche: {nicheFilter.toUpperCase()}</Badge>}
              {cityFilter !== 'all' && <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">City: {cityFilter.toUpperCase()}</Badge>}
              {sortBy !== 'final_score' && <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-primary/5 text-primary border-primary/10">Sort: {sortBy.replace(/_/g, ' ')}</Badge>}
              <span className="ml-1 font-semibold text-foreground">{totalLeads} leads matching</span>
            </div>
          )}

          {/* Low-intent notice */}
          {intent === 'low' && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span>ℹ️</span> Low intent prospects are automatically deleted after 7 days.
            </p>
          )}

          {/* Table */}
          <div className="-mx-4 sm:-mx-5 -mb-4 sm:-mb-5 border-t border-border/60">
            <LeadsTable
              leads={paginatedLeads}
              onMarkCalled={handleMarkCalled}
              isLoading={isLoadingLeads}
              callingId={callingId}
              currentPage={currentPage}
              pageSize={pageSize}
              totalLeads={totalLeads}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};
