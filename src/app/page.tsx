'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LeadsTable } from '@/components/leads-table';
import { CRMLeadsTable } from '@/components/crm-leads-table';
import { Lead, PipelineResult } from '@/types/lead';
import { SearchHistoryItem } from '@/types/history';
import Image from 'next/image';
import { 
  Search, 
  Loader2, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Menu, 
  X, 
  Database,
  History,
  UserCheck,
  TrendingUp,
  Calendar,
  DollarSign,
  Notebook,
  MessageCircle,
  Mail,
  Copy,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight
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
  
  // CRM leads and loading state
  const [crmLeads, setCrmLeads] = useState<Lead[]>([]);
  const [isLoadingCrm, setIsLoadingCrm] = useState(true);
  const [crmRefreshTrigger, setCrmRefreshTrigger] = useState(0);
  const [crmStatusFilter, setCrmStatusFilter] = useState<string>('all');
  const [selectedCRMLead, setSelectedCRMLead] = useState<Lead | null>(null);
  
  // CRM Lead Notes Editor fields
  const [editorStatus, setEditorStatus] = useState<'no_answer' | 'contacted' | 'meeting' | 'won' | 'lost'>('no_answer');
  const [editorNotes, setEditorNotes] = useState<string>('');
  const [editorFollowUp, setEditorFollowUp] = useState<string>('');
  const [editorValue, setEditorValue] = useState<number>(0);
  
  // CRM Contact & Outreach Editor fields
  const [editorPhone, setEditorPhone] = useState<string>('');
  const [editorWebsite, setEditorWebsite] = useState<string>('');
  const [editorEmail, setEditorEmail] = useState<string>('');
  const [editorWAPitch, setEditorWAPitch] = useState<string>('');
  const [editorEmailSubject, setEditorEmailSubject] = useState<string>('');
  const [editorEmailBody, setEditorEmailBody] = useState<string>('');
  
  // Clipboard Copy Feedback States
  const [copiedWA, setCopiedWA] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  
  // Outreach pitch template selector
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<'no_site' | 'broken_site' | 'weak_site'>('no_site');

  // Search history state
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Navigation and filter states
  const [activeTab, _setActiveTab] = useState<'prospects' | 'crm' | 'history'>('prospects');

  const setActiveTab = (tab: 'prospects' | 'crm' | 'history') => {
    _setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leads_finder_active_tab', tab);
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as 'prospects' | 'crm' | 'history';
      if (['prospects', 'crm', 'history'].includes(hash)) {
        setTimeout(() => _setActiveTab(hash), 0);
      } else {
        const savedTab = localStorage.getItem('leads_finder_active_tab') as 'prospects' | 'crm' | 'history';
        if (['prospects', 'crm', 'history'].includes(savedTab)) {
          setTimeout(() => _setActiveTab(savedTab), 0);
        }
      }
    }
  }, []);

  const [searchFilter, setSearchFilter] = useState<string | null>(null);

  // Pipeline result state
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sidebar toggle and sizing states
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [notesSidebarWide, setNotesSidebarWide] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Real-time progress tracking state
  const [progressLogs, setProgressLogs] = useState<string[]>([]);
  
  // Scraper console end ref for automatic scrolling
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // Confirmation dialogs state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState<(() => void) | null>(null);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState('');
  const [confirmDialogDesc, setConfirmDialogDesc] = useState('');


  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch search history:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll scraper console to bottom as logs stream in
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [progressLogs]);

  useEffect(() => {
    let active = true;
    
    const timer = setTimeout(() => {
      if (active) setIsLoadingLeads(true);
    }, 0);

    fetch(`/api/leads?called=false&showAll=${showAll}&intent=${intent}`)
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

  // Fetch CRM leads (called = true)
  useEffect(() => {
    let active = true;
    
    if (activeTab !== 'crm') return;

    const timer = setTimeout(() => {
      if (active) setIsLoadingCrm(true);
    }, 0);

    fetch('/api/leads?called=true')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch CRM leads.');
        return res.json();
      })
      .then((data) => {
        if (active) {
          setCrmLeads(data);
          setErrorText(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const error = err as Error;
          setErrorText(error.message || 'Something went wrong fetching CRM leads.');
        }
      })
      .finally(() => {
        clearTimeout(timer);
        if (active) setIsLoadingCrm(false);
      });

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeTab, crmRefreshTrigger]);

  // Update CRM Lead details (status, notes, deal value, follow-up)
  const handleUpdateCRMLead = async (id: number, fields: Partial<Lead>) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...fields }),
      });

      if (!res.ok) {
        throw new Error('Failed to save CRM details.');
      }

      const updateList = (prev: Lead[]) => {
        if (fields.called === false) {
          return prev.filter((lead) => lead.id !== id);
        }
        return prev.map((lead) => (lead.id === id ? { ...lead, ...fields } : lead));
      };

      setLeads((prev) => {
        if (fields.called === false) {
          return prev.filter((lead) => lead.id !== id);
        }
        return prev.map((lead) => (lead.id === id ? { ...lead, ...fields } : lead));
      });
      setCrmLeads(updateList);
      
      if (selectedCRMLead && selectedCRMLead.id === id) {
        setSelectedCRMLead(prev => prev ? { ...prev, ...fields } : null);
      }

      setRefreshTrigger((prev) => prev + 1);
      setCrmRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorText(error.message || 'Could not update lead details.');
    }
  };

  // Outreach Pitch Templates dictionary
  const OUTREACH_TEMPLATES = {
    no_site: {
      name: 'No Active Website',
      subject: (name: string) => `Improving Online Visibility for ${name}`,
      email: (name: string) => `Hi ${name},\n\nI recently came across your business online. I noticed that your business does not seem to have an active website, which could be causing you to miss out on local customers who are looking for your services.\n\nI specialize in helping local businesses launch fast, secure, and mobile-friendly websites that turn web visitors into paying customers.\n\nAre you available for a brief, 5-minute phone call this week to see how we can fix this?\n\nBest regards,\n[Your Name]`,
      whatsapp: (name: string) => `Hi ${name}, I noticed your business does not have an active website. I build high-converting websites for businesses. Let me know if you would be open to a quick call to look at potential fixes.`
    },
    broken_site: {
      name: 'Broken/Offline Website',
      subject: (name: string) => `Fixing Website Downtime for ${name}`,
      email: (name: string) => `Hi ${name},\n\nI recently tried visiting your website. I noticed that your site appears to be broken or offline, which means potential customers searching for you online cannot reach you.\n\nI build high-speed, secure, mobile-friendly websites and can get your online presence back up and running quickly.\n\nAre you available for a brief, 5-minute phone call this week to discuss how we can fix this?\n\nBest regards,\n[Your Name]`,
      whatsapp: (name: string) => `Hi ${name}, I noticed your website appears to be offline or broken. I build secure, high-converting websites. Let me know if you would be open to a quick call to get it fixed.`
    },
    weak_site: {
      name: 'Modern Website Redesign',
      subject: (name: string) => `Modern Website Redesign for ${name}`,
      email: (name: string) => `Hi ${name},\n\nI recently visited your website. I noticed that it could benefit from a few modern upgrades (like mobile optimization and stronger call-to-actions) to help you convert more web visitors into paying customers.\n\nI specialize in redesigning websites for local businesses to increase lead generation.\n\nAre you available for a brief, 5-minute phone call this week to review some quick fixes?\n\nBest regards,\n[Your Name]`,
      whatsapp: (name: string) => `Hi ${name}, I looked at your website and noticed it could benefit from mobile optimization. Redesigning can increase local leads. Let me know if you are open to a quick call to review fixes.`
    }
  };

  // Open Lead Sheet editor
  const handleOpenLeadNotes = (lead: Lead) => {
    setSelectedCRMLead(lead);
    setEditorStatus(lead.crm_status || 'no_answer');
    setEditorNotes(lead.notes || '');
    setEditorFollowUp(lead.follow_up_at ? lead.follow_up_at.substring(0, 10) : '');
    setEditorValue(lead.deal_value || 0);

    setEditorPhone(lead.phone || '');
    setEditorWebsite(lead.website || '');
    setEditorEmail(lead.email || '');

    let defaultKey: 'no_site' | 'broken_site' | 'weak_site' = 'no_site';
    if (lead.website) {
      const reasonLower = lead.reason.toLowerCase();
      if (reasonLower.includes('broken')) {
        defaultKey = 'broken_site';
      } else {
        defaultKey = 'weak_site';
      }
    }
    
    setSelectedTemplateKey(defaultKey);

    const name = lead.name || 'Business Owner';
    const template = OUTREACH_TEMPLATES[defaultKey];
    setEditorEmailSubject(template.subject(name));
    setEditorEmailBody(template.email(name));
    setEditorWAPitch(template.whatsapp(name));
  };

  // Handle switching template from dropdown
  const handleTemplateChange = (key: string) => {
    const templateKey = key as 'no_site' | 'broken_site' | 'weak_site';
    setSelectedTemplateKey(templateKey);
    if (!selectedCRMLead) return;
    const name = selectedCRMLead.name || 'Business Owner';
    const template = OUTREACH_TEMPLATES[templateKey];
    setEditorEmailSubject(template.subject(name));
    setEditorEmailBody(template.email(name));
    setEditorWAPitch(template.whatsapp(name));
  };

  const handleSaveEditorChanges = async () => {
    if (!selectedCRMLead) return;
    await handleUpdateCRMLead(selectedCRMLead.id, {
      crm_status: editorStatus,
      notes: editorNotes,
      follow_up_at: editorFollowUp ? new Date(editorFollowUp).toISOString() : null,
      deal_value: editorValue,
      phone: editorPhone || null,
      website: editorWebsite || null,
      email: editorEmail || null
    });
    setSelectedCRMLead(null);
  };

  // Run scraping pipeline
  const handleRunPipeline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isRunningPipeline) return;

    setIsRunningPipeline(true);
    setPipelineResult(null);
    setErrorText(null);
    setProgressLogs([]);

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        throw new Error('Pipeline execution initiation failed.');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Readable stream progress reading is not supported by your browser.');
      }

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              if (data.status === 'progress') {
                setProgressLogs((prev) => [...prev, data.message]);
              } else if (data.status === 'complete') {
                setPipelineResult(data.result);
              } else if (data.status === 'error') {
                throw new Error(data.message || 'Pipeline failed during streaming execution.');
              }
            } catch (errParse) {
              console.error('Error parsing stream event frame:', errParse);
            }
          }
        }
      }

      setRefreshTrigger((prev) => prev + 1);
      setCurrentPage(1);
      fetchHistory();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorText(error.message || 'Something went wrong. Try again.');
    } finally {
      setIsRunningPipeline(false);
    }
  };

  // Delete search history item
  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/history?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      } else {
        throw new Error('Failed to delete history item');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorText(error.message || 'Could not delete history item.');
    }
  };

  // Clear all search history (now using dialog)
  const handleClearAllHistory = () => {
    setConfirmDialogTitle('Clear All History');
    setConfirmDialogDesc('Are you sure you want to permanently clear all search history? This action cannot be undone.');
    setConfirmDialogAction(() => async () => {
      try {
        const res = await fetch('/api/history?all=true', {
          method: 'DELETE',
        });
        if (res.ok) {
          setHistory([]);
        } else {
          throw new Error('Failed to clear search history');
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorText(error.message || 'Could not clear history.');
      }
      setConfirmDialogOpen(false);
    });
    setConfirmDialogOpen(true);
  };

  // Mark a lead as called (optimistic update)
  const handleMarkCalled = async (id: number) => {
    setCallingId(id);
    
    const originalLeads = [...leads];
    
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
      setLeads(originalLeads);
      setErrorText(error.message || 'Could not update lead called status. Refreshed table.');
    } finally {
      setCallingId(null);
    }
  };

  // Client-side filter query matching source
  const filteredLeads = searchFilter
    ? leads.filter((lead) => lead.source?.toLowerCase().trim() === searchFilter.toLowerCase().trim())
    : leads;

  // Calculate paginated leads
  const totalLeads = filteredLeads.length;
  const totalPages = Math.ceil(totalLeads / pageSize) || 1;
  const activePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (activePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // CRM Search & Filters
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const filteredCrmLeads = crmLeads.filter(l => {
    const matchesStatus = crmStatusFilter === 'all' || l.crm_status === crmStatusFilter;
    const matchesSearch = crmSearchQuery.trim() === '' || 
      l.name?.toLowerCase().includes(crmSearchQuery.toLowerCase()) || 
      l.phone?.includes(crmSearchQuery) || 
      l.source?.toLowerCase().includes(crmSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate CRM Stats
  const activeCrmDeals = crmLeads.filter(l => l.crm_status !== 'lost' && l.crm_status !== 'won');
  const pipelineValue = activeCrmDeals.reduce((sum, l) => sum + (l.deal_value || 0), 0);
  
  const wonDeals = crmLeads.filter(l => l.crm_status === 'won');
  const wonRevenue = wonDeals.reduce((sum, l) => sum + (l.deal_value || 0), 0);
  
  const lostDeals = crmLeads.filter(l => l.crm_status === 'lost');
  const totalClosed = wonDeals.length + lostDeals.length;
  const closeRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;
  
  const pendingFollowUps = crmLeads.filter(l => {
    if (!l.follow_up_at || l.crm_status === 'won' || l.crm_status === 'lost') return false;
    const date = new Date(l.follow_up_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compDate = new Date(date);
    compDate.setHours(0, 0, 0, 0);
    return compDate.getTime() <= today.getTime();
  }).length;

  const totalCrmLeads = filteredCrmLeads.length;
  const crmPages = Math.ceil(totalCrmLeads / pageSize) || 1;
  const activeCrmPage = Math.min(Math.max(1, currentPage), crmPages);
  const startCrmIdx = (activeCrmPage - 1) * pageSize;
  const paginatedCrmLeads = filteredCrmLeads.slice(startCrmIdx, startCrmIdx + pageSize);

  return (
    <div className="min-h-screen bg-background flex font-sans antialiased text-foreground">
      {/* Desktop Left Sidebar */}
      <aside className={`hidden lg:flex border-r border-border bg-card flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${
        leftSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className={`h-16 border-b border-border flex items-center shrink-0 bg-card transition-all duration-300 ${
          leftSidebarCollapsed ? 'px-4 justify-center' : 'px-6 gap-2.5'
        }`}>
          <Image src="/logo.png" alt="Leads Finder" width={28} height={28} className="w-7 h-7 rounded-lg object-contain shadow-sm border border-border/50" />
          {!leftSidebarCollapsed && <span className="text-sm font-bold text-foreground tracking-tight">Leads Finder</span>}
        </div>
        
        {/* Sidebar Navigation */}
        <nav className={`flex-1 py-6 space-y-1.5 transition-all duration-300 ${
          leftSidebarCollapsed ? 'px-2' : 'px-4'
        }`}>
          {!leftSidebarCollapsed && (
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pipeline
            </div>
          )}
          <button
            onClick={() => setActiveTab('prospects')}
            className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all ${
              leftSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
            } ${
              activeTab === 'prospects'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            title={leftSidebarCollapsed ? "Prospects" : undefined}
          >
            <Database className="w-4 h-4 shrink-0" />
            {!leftSidebarCollapsed && <span>Prospects</span>}
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all relative ${
              leftSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
            } ${
              activeTab === 'crm'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            title={leftSidebarCollapsed ? "CRM Dashboard" : undefined}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            {!leftSidebarCollapsed && <span>CRM Dashboard</span>}
            {pendingFollowUps > 0 && (
              <Badge variant="destructive" className={`text-[8px] h-4 min-w-[16px] px-1 flex items-center justify-center animate-pulse ${leftSidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'}`}>
                {pendingFollowUps}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all ${
              leftSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
            } ${
              activeTab === 'history'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            title={leftSidebarCollapsed ? "History" : undefined}
          >
            <History className="w-4 h-4 shrink-0" />
            {!leftSidebarCollapsed && <span>History</span>}
          </button>
        </nav>

        {/* Sidebar Footer / Collapse Toggle */}
        <div className={`p-4 border-t border-border shrink-0 bg-muted/10 transition-all duration-300 ${
          leftSidebarCollapsed ? 'flex justify-center' : 'flex justify-end'
        }`}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            className="h-8 w-8"
            title={leftSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {leftSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer - Using Shadcn Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="h-16 border-b border-border flex flex-row items-center gap-2.5 px-6 space-y-0">
            <Image src="/logo.png" alt="Leads Finder" width={28} height={28} className="w-7 h-7 rounded-lg object-contain shadow-sm border border-border/50" />
            <SheetTitle className="text-sm font-bold tracking-tight">Leads Finder</SheetTitle>
          </SheetHeader>
          <SheetDescription className="sr-only">Navigation menu</SheetDescription>

          <nav className="flex-1 px-4 py-6 space-y-1.5">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pipeline
            </div>
            <button
              onClick={() => {
                setActiveTab('prospects');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'prospects'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              Prospects
            </button>
            <button
              onClick={() => {
                setActiveTab('crm');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'crm'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              CRM Dashboard
              {pendingFollowUps > 0 && (
                <Badge variant="destructive" className="ml-auto text-[8px] h-4 min-w-[16px] px-1 animate-pulse">
                  {pendingFollowUps}
                </Badge>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              History
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Page Workspace Layout Container */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        leftSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        {/* Dashboard Top Header */}
        <header className="bg-card border-b sticky top-0 z-30 shadow-sm shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden h-11 w-11 flex items-center justify-center"
              >
                <Menu className="w-6 h-6" />
              </Button>
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="Leads Finder" width={24} height={24} className="lg:hidden w-6 h-6 rounded-md object-contain shadow-sm border border-border/50" />
                <h1 className="text-sm font-bold text-foreground leading-none">
                  {activeTab === 'prospects' ? 'Prospects' : activeTab === 'crm' ? 'CRM Dashboard' : 'Search History'}
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content Space */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full space-y-6">
          {activeTab === 'prospects' && (
            <>
              {/* Dashboard Dynamic Real-time Stats */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300">
                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Total Prospects</span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{filteredLeads.length}</span>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Pending Calls</span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{filteredLeads.filter(l => !l.called).length}</span>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Hot Prospects</span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{filteredLeads.filter(l => l.score >= 70).length}</span>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Avg Quality</span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">
                      {filteredLeads.length > 0 ? Math.round(filteredLeads.reduce((acc, l) => acc + l.score, 0) / filteredLeads.length) : 0}
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
                <Card className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <CardHeader className="bg-muted/40 px-5 py-3 border-b border-border">
                    <CardTitle className="text-xs font-bold flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      Scraping Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 max-h-60 overflow-y-auto space-y-2 text-xs font-sans">
                    {progressLogs.length === 0 ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        <span>Initializing Places search workers...</span>
                      </div>
                    ) : (
                      progressLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
                          {idx === progressLogs.length - 1 ? (
                            <>
                              <span className="text-primary font-bold animate-pulse">⚡</span>
                              <span className="text-foreground font-bold leading-normal">
                                {log}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span className="text-muted-foreground leading-normal">{log}</span>
                            </>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={consoleEndRef} />
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

              {/* Active Filter Badge */}
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
                      Clear Filter
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Leads Table Container */}
              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6 border-b border-border flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 space-y-0">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-base font-bold leading-none">Prospects Database</CardTitle>
                    {intent === 'low' && (
                      <CardDescription className="text-[11px] mt-1.5 flex items-center gap-1.5">
                        <span>ℹ️</span> Low intent prospects are automatically deleted after 7 days to keep your database clean.
                      </CardDescription>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    {/* Quality Intent Filter — Shadcn Tabs */}
                    <Tabs value={intent} onValueChange={(v) => { setIntent(v as 'high' | 'low' | 'all'); setCurrentPage(1); }} className="flex-1 sm:flex-initial">
                      <TabsList className="h-9 w-full sm:w-auto">
                        <TabsTrigger value="high" className="text-xs font-semibold flex-1 sm:flex-none px-3">High Intent</TabsTrigger>
                        <TabsTrigger value="low" className="text-xs font-semibold flex-1 sm:flex-none px-3">Low Intent</TabsTrigger>
                        <TabsTrigger value="all" className="text-xs font-semibold flex-1 sm:flex-none px-3">All</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {/* Show Called Toggle — Shadcn Tabs */}
                    <Tabs value={showAll ? 'all' : 'uncalled'} onValueChange={(v) => { setShowAll(v === 'all'); setCurrentPage(1); }} className="flex-1 sm:flex-initial">
                      <TabsList className="h-9 w-full sm:w-auto">
                        <TabsTrigger value="uncalled" className="text-xs font-semibold flex-1 sm:flex-none px-3 gap-1.5">
                          <Filter className="w-3.5 h-3.5" />
                          Uncalled
                        </TabsTrigger>
                        <TabsTrigger value="all" className="text-xs font-semibold flex-1 sm:flex-none px-3">
                          All Status
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>

                <div className="p-0">
                  <LeadsTable
                    leads={paginatedLeads}
                    onMarkCalled={handleMarkCalled}
                    isLoading={isLoadingLeads}
                    callingId={callingId}
                    currentPage={activePage}
                    pageSize={pageSize}
                    totalLeads={totalLeads}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </Card>
            </>
          )}

          {activeTab === 'crm' && (
            <>
              {/* CRM Stats Grid */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300">
                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" /> Active Pipeline
                    </span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">
                      ${pipelineValue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium block mt-1.5">
                      From {activeCrmDeals.length} active leads
                    </span>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Won Revenue
                    </span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight block mt-1">
                      ${wonRevenue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium block mt-1.5">
                      From {wonDeals.length} closed won deals
                    </span>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] font-medium text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Due Today / Overdue
                    </span>
                    <span className={`text-2xl font-bold tracking-tight block mt-1 ${pendingFollowUps > 0 ? 'text-rose-500 animate-pulse' : 'text-foreground'}`}>
                      {pendingFollowUps}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium block mt-1.5">
                      Requires immediate action
                    </span>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Close Rate
                    </span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">
                      {closeRate}%
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium block mt-1.5">
                      From {totalClosed} closed deals
                    </span>
                  </CardContent>
                </Card>
              </section>

              {/* CRM Search & Filters control center */}
              <Card>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row gap-4 justify-between items-center w-full">
                    <div className="relative w-full lg:max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search CRM by lead name, phone, source..."
                        value={crmSearchQuery}
                        onChange={(e) => {
                          setCrmSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10 h-11 lg:h-10 w-full"
                      />
                    </div>

                    {/* Status Filters — Tabs component */}
                    <Tabs value={crmStatusFilter} onValueChange={(v) => { setCrmStatusFilter(v); setCurrentPage(1); }} className="w-full lg:w-auto overflow-x-auto scrollbar-none">
                      <TabsList className="h-11 lg:h-9 w-full lg:w-auto flex flex-nowrap lg:flex-wrap items-center justify-start lg:justify-center border border-border p-1 rounded-lg bg-muted/40 whitespace-nowrap">
                        {[
                          { value: 'all', label: 'All' },
                          { value: 'no_answer', label: 'Attempted' },
                          { value: 'contacted', label: 'Contacted' },
                          { value: 'meeting', label: 'Meeting' },
                          { value: 'won', label: 'Won' },
                          { value: 'lost', label: 'Lost' }
                        ].map(tab => (
                          <TabsTrigger key={tab.value} value={tab.value} className="text-xs font-semibold px-3 py-1 h-9 lg:h-7 flex items-center justify-center">
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
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

              {/* CRM Database Table Container */}
              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-5 border-b border-border space-y-1">
                  <CardTitle className="text-base font-bold leading-none">Sales Pipeline</CardTitle>
                  <CardDescription className="text-[11px]">
                    Manage active discussions, schedule pitches, record comments, and finalize won client rebuilds.
                  </CardDescription>
                </CardHeader>

                <div className="p-0">
                  <CRMLeadsTable
                    leads={paginatedCrmLeads}
                    onUpdateLead={handleUpdateCRMLead}
                    onOpenNotes={handleOpenLeadNotes}
                    isLoading={isLoadingCrm}
                    currentPage={activeCrmPage}
                    pageSize={pageSize}
                    totalLeads={totalCrmLeads}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </Card>
            </>
          )}

          {activeTab === 'history' && (
            <Card className="overflow-hidden animate-in fade-in duration-300">
              <CardHeader className="p-4 sm:p-6 border-b border-border flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-bold leading-none flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    Search History Control Center
                  </CardTitle>
                  <CardDescription className="text-[11px] mt-1">
                    Review past scraping runs, lead yields, and rerun searches.
                  </CardDescription>
                </div>
                {history.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAllHistory}
                    className="text-xs font-semibold px-3 py-1.5 h-8"
                  >
                    Clear All
                  </Button>
                )}
              </CardHeader>

              <div className="overflow-x-auto">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center m-6 border-2 border-dashed border-border rounded-2xl bg-card/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-sm animate-pulse">
                      <History className="w-5.5 h-5.5 text-primary" />
                    </div>
                    <h3 className="font-extrabold text-base text-foreground tracking-tight">No Search History</h3>
                    <p className="text-muted-foreground text-xs max-w-sm mt-2 leading-relaxed">
                      Your query history is currently empty. Go to the <span className="font-bold text-primary">Prospects</span> tab and scrape local keywords to populate history.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        <th className="px-6 py-3.5">Query</th>
                        <th className="px-6 py-3.5">Last Scrape Date</th>
                        <th className="px-6 py-3.5 text-center">Run Count</th>
                        <th className="px-6 py-3.5 text-center">Lead Yield</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate">
                            {item.query}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(item.last_run_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-muted-foreground">
                            {item.run_count}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px] border-emerald-500/20">
                              {item.last_stored} stored
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchFilter(item.query);
                                setActiveTab('prospects');
                                setCurrentPage(1);
                              }}
                              className="text-[10px] font-bold h-7 px-2.5"
                            >
                              View Prospects
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isRunningPipeline}
                              onClick={() => {
                                setQuery(item.query);
                                setActiveTab('prospects');
                                setCurrentPage(1);
                                setTimeout(() => {
                                  const form = document.querySelector('form');
                                  if (form) form.requestSubmit();
                                }, 0);
                              }}
                              className="text-[10px] font-bold h-7 px-2.5 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                            >
                              Re-run Scrape
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                              className="text-[10px] font-bold h-7 px-2 hover:bg-destructive/10 hover:text-destructive"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}
        </main>

        {/* Integrated Footer */}
        <footer className="bg-card border-t border-border py-4 text-center text-[10px] text-muted-foreground shrink-0 mt-auto">
          <div className="max-w-7xl mx-auto px-4">
            Leads Finder &copy; {new Date().getFullYear()}.
          </div>
        </footer>

        {/* CRM Lead Notes & Editor — Shadcn Sheet */}
        <Sheet open={!!selectedCRMLead} onOpenChange={(open) => { if (!open) setSelectedCRMLead(null); }}>
          <SheetContent side="right" className={`${notesSidebarWide ? 'lg:max-w-2xl' : 'lg:max-w-md'} w-full p-0 flex flex-col h-full transition-all duration-300`}>
            {/* Drawer Header */}
            <SheetHeader className="px-6 py-5 border-b border-border shrink-0 bg-muted/20 space-y-1">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Badge className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                    Lead CRM Profile
                  </Badge>
                  <SheetTitle className="text-base font-bold truncate max-w-[240px] sm:max-w-md">
                    {selectedCRMLead?.name}
                  </SheetTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotesSidebarWide(!notesSidebarWide)}
                  className="h-11 w-11 hidden sm:flex items-center justify-center"
                  title={notesSidebarWide ? "Collapse notes panel" : "Expand notes panel"}
                >
                  {notesSidebarWide ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </SheetHeader>
            <SheetDescription className="sr-only">Edit lead CRM details, notes, and outreach.</SheetDescription>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Contact Information (Enrichment) */}
              <Card className="bg-muted/30 border-border/50">
                <CardContent className="p-4 space-y-4">
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block">
                    Contact Channels
                  </span>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Phone Number</label>
                    <Input
                      type="text"
                      value={editorPhone}
                      onChange={(e) => setEditorPhone(e.target.value)}
                      className="h-11 lg:h-9 text-xs font-semibold"
                      placeholder="e.g. 9876543210"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Email Address</label>
                    <Input
                      type="email"
                      value={editorEmail}
                      onChange={(e) => setEditorEmail(e.target.value)}
                      className="h-11 lg:h-9 text-xs font-semibold"
                      placeholder="owner@business.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Website URL</label>
                    <Input
                      type="text"
                      value={editorWebsite}
                      onChange={(e) => setEditorWebsite(e.target.value)}
                      className="h-11 lg:h-9 text-xs font-semibold"
                      placeholder="www.business.com"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Status Dropdown — Shadcn Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Pipeline Stage</label>
                  <Select value={editorStatus} onValueChange={(v) => setEditorStatus(v as typeof editorStatus)}>
                    <SelectTrigger className="h-11 lg:h-10 text-xs font-semibold">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_answer">Attempted / No Answer</SelectItem>
                      <SelectItem value="contacted">Spoke to Owner</SelectItem>
                      <SelectItem value="meeting">Meeting Scheduled</SelectItem>
                      <SelectItem value="won">Closed Won</SelectItem>
                      <SelectItem value="lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Deal Value */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Est. Deal Value ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={editorValue}
                      onChange={(e) => setEditorValue(Number(e.target.value) || 0)}
                      className="h-11 lg:h-10 text-xs font-bold pl-7"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Follow-up Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Next Follow-up Date</label>
                  <Input
                    type="date"
                    value={editorFollowUp}
                    onChange={(e) => setEditorFollowUp(e.target.value)}
                    className="h-11 lg:h-10 text-xs font-semibold"
                  />
                </div>

                {/* CRM Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Notebook className="w-3.5 h-3.5 text-muted-foreground" /> CRM Conversation Logs & Notes
                  </label>
                  <textarea
                    value={editorNotes}
                    onChange={(e) => setEditorNotes(e.target.value)}
                    rows={5}
                    className="w-full text-xs font-medium bg-background border border-input rounded-md p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed"
                    placeholder="Record call responses, specific requests, custom quote breakdowns..."
                  />
                </div>

                {/* OUTREACH CHANNELS PREVIEW & EXECUTION */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block">
                    Outreach Assistant
                  </span>

                  {/* Template Selector — Shadcn Select */}
                  <Card className="bg-muted/30 border-border/50">
                    <CardContent className="p-3 space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Pitch Strategy Template
                      </label>
                      <Select value={selectedTemplateKey} onValueChange={handleTemplateChange}>
                        <SelectTrigger className="h-11 lg:h-8 text-xs font-semibold">
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_site">No Active Website Pitch</SelectItem>
                          <SelectItem value="broken_site">Broken / Offline Website Pitch</SelectItem>
                          <SelectItem value="weak_site">Modern Redesign Upgrade Pitch</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* WhatsApp Template editor and Send/Copy Buttons */}
                  <Card className="bg-emerald-500/5 border-emerald-500/10">
                    <CardContent className="p-3.5 space-y-2">
                      <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Message Pitch
                      </label>
                      <textarea
                        value={editorWAPitch}
                        onChange={(e) => setEditorWAPitch(e.target.value)}
                        rows={3}
                        className="w-full text-[11px] font-medium bg-background border border-input rounded-md p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-normal"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            const cleanPhone = editorPhone ? editorPhone.replace(/\D/g, '') : '';
                            if (!cleanPhone) {
                              alert('Please enter a phone number first to trigger WhatsApp outreach.');
                              return;
                            }
                            const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(editorWAPitch)}`;
                            window.open(url, '_blank');
                          }}
                          className="flex-1 h-11 lg:h-9 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Send WhatsApp
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(editorWAPitch);
                            setCopiedWA(true);
                            setTimeout(() => setCopiedWA(false), 2000);
                          }}
                          className="h-11 lg:h-9 px-4 text-[11px] font-bold border-emerald-600/20 text-emerald-600 hover:bg-emerald-600/5"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          {copiedWA ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Template editor and Send/Copy Buttons */}
                  <Card className="bg-rose-500/5 border-rose-500/10">
                    <CardContent className="p-3.5 space-y-2">
                      <label className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> Email Pitch Customizer
                      </label>
                      <Input
                        type="text"
                        value={editorEmailSubject}
                        onChange={(e) => setEditorEmailSubject(e.target.value)}
                        className="h-11 lg:h-8 text-[11px] font-bold"
                        placeholder="Email Subject"
                      />
                      <textarea
                        value={editorEmailBody}
                        onChange={(e) => setEditorEmailBody(e.target.value)}
                        rows={4}
                        className="w-full text-[11px] font-medium bg-background border border-input rounded-md p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-normal"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            const url = `mailto:${editorEmail}?subject=${encodeURIComponent(editorEmailSubject)}&body=${encodeURIComponent(editorEmailBody)}`;
                            window.open(url);
                          }}
                          className="flex-1 h-11 lg:h-9 text-[11px] font-bold bg-rose-500 hover:bg-rose-600 text-white"
                        >
                          <Mail className="w-3.5 h-3.5 mr-1.5" /> Send Email
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const fullEmailText = `Subject: ${editorEmailSubject}\n\n${editorEmailBody}`;
                            navigator.clipboard.writeText(fullEmailText);
                            setCopiedEmail(true);
                            setTimeout(() => setCopiedEmail(false), 2000);
                          }}
                          className="h-11 lg:h-9 px-4 text-[11px] font-bold border-rose-500/20 text-rose-500 hover:bg-rose-500/5"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          {copiedEmail ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <SheetFooter className="p-4 pb-safe-padded border-t border-border shrink-0 bg-muted/10 grid grid-cols-2 gap-3 sm:space-x-0">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCRMLead(null)}
                className="text-xs font-semibold h-11 lg:h-10 w-full"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEditorChanges}
                className="text-xs font-bold h-11 lg:h-10 w-full"
              >
                Save Changes
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{confirmDialogTitle}</DialogTitle>
              <DialogDescription>{confirmDialogDesc}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => { if (confirmDialogAction) confirmDialogAction(); }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
