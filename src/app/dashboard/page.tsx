'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LeadsTable } from '@/components/leads-table';
import { CRMLeadsTable } from '@/components/crm-leads-table';
import { Lead, PipelineResult } from '@/types/lead';
import { SearchHistoryItem } from '@/types/history';
import { supabaseClient } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

import Image from 'next/image';
import Link from 'next/link';
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
  ChevronRight,
  RefreshCw,
  Phone,
  Flame,
  Target,
  Award,
  Sparkles,
  Check,
  Zap,
  Video,
  Users,
  LogOut,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Ban
} from 'lucide-react';



const SUGGESTIONS = [
  'salons in mumbai',
  'dentists in bangalore',
  'gyms in delhi',
  'coaching classes in pune',
  'real estate agents in hyderabad',
];

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: 'super_admin' | 'user';
  status: 'pending' | 'approved' | 'rejected' | 'disabled' | 'blocked';
  created_at: string;
  updated_at: string;
}

function SafeAvatar({ src, name, email, className }: { src: string | null | undefined; name: string | null; email: string | null; className?: string }) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [isError, setIsError] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsError(false);
  }

  const hasAvatar = src && src.trim() !== '' && src !== 'undefined' && src !== 'null' && !isError;

  if (hasAvatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Avatar"
        className={className}
        onError={() => setIsError(true)}
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0 shadow-sm">
      {name?.charAt(0) || email?.charAt(0).toUpperCase() || 'U'}
    </div>
  );
}

export default function LeadGenDashboard() {
  // Authentication & Session States
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSyncingAuth, setIsSyncingAuth] = useState(true);

  // User Management State (Super Admin only)
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersRefreshTrigger, setUsersRefreshTrigger] = useState(0);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');


  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [intent, setIntent] = useState<'high' | 'low' | 'all'>('high');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [callingId, setCallingId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Advanced Pipeline UI State Variables
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('final_score');

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
  const [editorMeetingNotes, setEditorMeetingNotes] = useState<string>('');
  const [editorMeetingLink, setEditorMeetingLink] = useState<string>('');
  const [editorValidationError, setEditorValidationError] = useState<string | null>(null);
  
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
  const [activeTab, _setActiveTab] = useState<'prospects' | 'crm' | 'history' | 'users'>('prospects');

  const setActiveTab = (tab: 'prospects' | 'crm' | 'history' | 'users') => {
    _setActiveTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leads_finder_active_tab', tab);
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as 'prospects' | 'crm' | 'history' | 'users';
      if (['prospects', 'crm', 'history', 'users'].includes(hash)) {
        setTimeout(() => _setActiveTab(hash), 0);
      } else {
        const savedTab = localStorage.getItem('leads_finder_active_tab') as 'prospects' | 'crm' | 'history' | 'users';
        if (['prospects', 'crm', 'history', 'users'].includes(savedTab)) {
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
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  const [isStreamDone, setIsStreamDone] = useState<boolean>(false);
  const [currentProgressMessage, setCurrentProgressMessage] = useState<string>('');
  
  // Scraper console container ref for local scrolling
  const consoleContainerRef = useRef<HTMLDivElement | null>(null);

  // Confirmation dialogs state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState<(() => void) | null>(null);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState('');
  const [confirmDialogDesc, setConfirmDialogDesc] = useState('');

  // 1. Synchronize current user state via secure /api/me sync logic
  const syncProfile = async (currentSession: Session | null) => {
    if (!currentSession) return;
    try {
      const res = await fetch('/api/me', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to sync authentication profile details:', errData.error || res.statusText);
        if (res.status === 401 || res.status === 403) {
          setProfile(null);
          // Sign out client-side to clear the invalid or expired session from localStorage
          supabaseClient.auth.signOut().catch((err) => {
            console.error('Failed to sign out after unauthorized sync:', err);
          });
        }
      }

    } catch (err) {
      console.error('Profile synchronization error:', err);
      // Do not clear the existing profile on transient network errors to avoid kicking the user to the login screen
    } finally {
      setIsSyncingAuth(false);
    }
  };

  const fetchHistory = async (sess: Session | null = session) => {
    if (!sess) return;
    try {
      const res = await fetch('/api/history', {
        headers: {
          Authorization: `Bearer ${sess.access_token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch search history:', err);
    }
  };

  // 2. Initial Authentication Listeners & State Sync on mount
  useEffect(() => {
    // Check for initial session state
    supabaseClient.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        syncProfile(initialSession);
      } else {
        setIsSyncingAuth(false);
      }
    });

    // Subscriptions for user authentication state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        syncProfile(currentSession);
      } else {
        setProfile(null);
        setIsSyncingAuth(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch search history only when user session is active and profile status is approved
  useEffect(() => {
    if (session && profile && profile.status === 'approved') {
      setTimeout(() => {
        fetchHistory(session);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, profile]);

  // 3. Auto-polling interval: checks pending status every 5 seconds until approved
  useEffect(() => {
    if (!session || !profile || profile.status !== 'pending') return;

    const interval = setInterval(() => {
      syncProfile(session);
    }, 5000);

    return () => clearInterval(interval);
  }, [session, profile]);



  // 4. Admin View Loader Hook: loads users list if admin and users tab active
  useEffect(() => {
    if (activeTab !== 'users' || !session || profile?.role !== 'super_admin') return;

    let active = true;
    const timer = setTimeout(() => {
      if (active) setIsLoadingUsers(true);
    }, 0);

    fetch('/api/admin/users', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user profiles list.');
        return res.json();
      })
      .then((data) => {
        if (active) {
          setUsers(data);
        }
      })
      .catch((err) => {
        console.error('Admin fetching users error:', err);
      })
      .finally(() => {
        clearTimeout(timer);
        if (active) setIsLoadingUsers(false);
      });

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeTab, session, profile, usersRefreshTrigger]);


  // 5. Admin Status update trigger handler
  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    if (!session) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: userId, status: newStatus })
      });
      if (res.ok) {
        setUsersRefreshTrigger(prev => prev + 1);
        setErrorText(null);
      } else {
        const errorData = await res.json();
        setErrorText(errorData.error || 'Failed to update user status.');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      setErrorText('Failed to update user status.');
    }
  };

  // OAuth Google authentication triggers
  const handleGoogleSignIn = async () => {
    try {
      setIsSyncingAuth(true);
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Google Sign-in error:', error.message);
      setErrorText(error.message || 'Failed to initialize Google Authentication.');
      setIsSyncingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSyncingAuth(true);
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      setSession(null);
      setProfile(null);
      setActiveTab('prospects');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Sign-out error:', error.message);
      setErrorText(error.message || 'Failed to sign out.');
    } finally {
      setIsSyncingAuth(false);
    }
  };



  // Auto-scroll scraper console locally to bottom as logs stream in
  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [progressLogs]);

  // Decoupled ultra-smooth visual progress easing logic (25 fps updates)
  useEffect(() => {
    if (!isRunningPipeline) {
      return;
    }

    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        // If target progress is 100% (pipeline completion signaled)
        if (progressPercent === 100) {
          const diff = 100 - prev;
          const step = Math.max(1, diff * 0.12); // Smooth ease-out catchup
          const nextVal = prev + step;
          return nextVal >= 99.8 ? 100 : parseFloat(nextVal.toFixed(1));
        }

        // If display progress lags behind reported progress
        if (prev < progressPercent) {
          const diff = progressPercent - prev;
          const step = Math.max(0.4, diff * 0.08); // Ease towards target
          return parseFloat((prev + step).toFixed(1));
        } else {
          // Creep forward slowly to show visual activity during long steps (stops at 95%)
          if (prev < 95) {
            return parseFloat((prev + 0.05).toFixed(1));
          }
          return prev;
        }
      });
    }, 40);

    return () => clearInterval(interval);
  }, [progressPercent, isRunningPipeline]);

  // Handle delayed closure of progress console upon 100% easing completion
  useEffect(() => {
    if (displayProgress === 100 && isStreamDone) {
      const timer = setTimeout(() => {
        setIsRunningPipeline(false);
        setIsStreamDone(false);
        setDisplayProgress(0); // Safely reset here within an async callback
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [displayProgress, isStreamDone]);

  useEffect(() => {
    if (!session || !profile || profile.status !== 'approved') return;

    let active = true;
    
    const timer = setTimeout(() => {
      if (active) setIsLoadingLeads(true);
    }, 0);

    fetch(`/api/leads?called=false&showAll=${showAll}&intent=${intent}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })
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
  }, [showAll, intent, refreshTrigger, session, profile]);

  // Fetch CRM leads (called = true)
  useEffect(() => {
    if (!session || !profile || profile.status !== 'approved' || activeTab !== 'crm') return;

    let active = true;
    
    const timer = setTimeout(() => {
      if (active) setIsLoadingCrm(true);
    }, 0);

    fetch('/api/leads?called=true', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })
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
  }, [activeTab, crmRefreshTrigger, session, profile]);

  // Update CRM Lead details (status, notes, deal value, follow-up)
  const handleUpdateCRMLead = async (id: number, fields: Partial<Lead>) => {
    try {
      const lead = crmLeads.find((l) => l.id === id) || leads.find((l) => l.id === id);
      if (lead && fields.crm_status !== undefined && fields.crm_status !== lead.crm_status) {
        const notes = fields.notes !== undefined ? fields.notes : lead.notes;
        const followUp = fields.follow_up_at !== undefined ? fields.follow_up_at : lead.follow_up_at;
        const value = fields.deal_value !== undefined ? fields.deal_value : lead.deal_value;
        const meetingNotes = fields.meeting_notes !== undefined ? fields.meeting_notes : lead.meeting_notes;
        const meetingLink = fields.meeting_link !== undefined ? fields.meeting_link : lead.meeting_link;

        if (fields.crm_status === 'contacted') {
          if (!notes?.trim() || !followUp) {
            handleOpenLeadNotes(lead);
            setEditorStatus('contacted');
            setEditorValidationError("CRM Conversation Logs & Notes and Follow Up Date are mandatory for 'Spoke to Owner' stage.");
            return;
          }
        } else if (fields.crm_status === 'meeting') {
          if (!meetingNotes?.trim() || !followUp || !meetingLink?.trim()) {
            handleOpenLeadNotes(lead);
            setEditorStatus('meeting');
            setEditorValidationError("Meeting Notes, Date, and Meeting Link are mandatory for 'Meeting Scheduled' stage.");
            return;
          }
        } else if (fields.crm_status === 'won') {
          if (!value || value <= 0) {
            handleOpenLeadNotes(lead);
            setEditorStatus('won');
            setEditorValidationError("Est. Deal Value (Amount) is mandatory and must be greater than 0 for 'Closed Won' stage.");
            return;
          }
        }
      }

      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, ...fields }),
      });


      if (!res.ok) {
        throw new Error('Failed to save CRM details.');
      }

      const updateList = (prev: Lead[]) => {
        if (fields.called === false) {
          return prev.filter((lead) => lead.id !== id);
        }
        const exists = prev.some((l) => l.id === id);
        if (!exists && fields.called === true) {
          const orig = leads.find((l) => l.id === id);
          if (orig) {
            return [{ ...orig, ...fields }, ...prev];
          }
        }
        return prev.map((lead) => (lead.id === id ? { ...lead, ...fields } : lead));
      };

      setLeads((prev) => {
        if (fields.called === false) {
          return prev.filter((lead) => lead.id !== id);
        }
        if (fields.called === true && !showAll) {
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
    setEditorMeetingNotes(lead.meeting_notes || '');
    setEditorMeetingLink(lead.meeting_link || '');
    setEditorValidationError(null);

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

    if (editorStatus === 'contacted') {
      if (!editorNotes.trim()) {
        setEditorValidationError("CRM Conversation Logs & Notes is mandatory for 'Spoke to Owner' stage.");
        return;
      }
      if (!editorFollowUp) {
        setEditorValidationError("Follow Up Date is mandatory for 'Spoke to Owner' stage.");
        return;
      }
    } else if (editorStatus === 'meeting') {
      if (!editorMeetingNotes.trim()) {
        setEditorValidationError("Meeting Notes are mandatory for 'Meeting Scheduled' stage.");
        return;
      }
      if (!editorFollowUp) {
        setEditorValidationError("Meeting Date is mandatory for 'Meeting Scheduled' stage.");
        return;
      }
      if (!editorMeetingLink.trim()) {
        setEditorValidationError("Meeting Link is mandatory for 'Meeting Scheduled' stage.");
        return;
      }
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
      if (!urlPattern.test(editorMeetingLink.trim())) {
        setEditorValidationError("Please enter a valid URL for the Meeting Link (e.g. https://meet.google.com/abc).");
        return;
      }
    } else if (editorStatus === 'won') {
      if (!editorValue || editorValue <= 0) {
        setEditorValidationError("Est. Deal Value (Amount) is mandatory and must be greater than 0 for 'Closed Won' stage.");
        return;
      }
    }

    setEditorValidationError(null);

    await handleUpdateCRMLead(selectedCRMLead.id, {
      called: true,
      crm_status: editorStatus,
      notes: editorNotes,
      follow_up_at: editorFollowUp ? new Date(editorFollowUp).toISOString() : null,
      deal_value: editorValue,
      phone: editorPhone || null,
      website: editorWebsite || null,
      email: editorEmail || null,
      meeting_notes: editorMeetingNotes,
      meeting_link: editorMeetingLink
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
    setProgressPercent(0);
    setDisplayProgress(0);
    setIsStreamDone(false);
    setCurrentProgressMessage('');

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
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
                if (data.progress !== undefined) {
                  setProgressPercent(data.progress);
                }
                if (data.active_biz) {
                  setCurrentProgressMessage(data.active_biz);
                }
              } else if (data.status === 'complete') {
                setPipelineResult(data.result);
                setProgressPercent(100);
                setCurrentProgressMessage('Scrape complete.');
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

      // Trigger the completion animation sequence in the frontend
      setProgressPercent(100);
      setIsStreamDone(true);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorText(error.message || 'Something went wrong. Try again.');
      setIsRunningPipeline(false);
      setIsStreamDone(false);
    }
  };

  // Delete search history item
  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/history?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
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
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
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
  const handleMarkCalled = async (id: number, crmStatus?: 'contacted' | 'no_answer') => {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;

    if (crmStatus === 'contacted') {
      handleOpenLeadNotes({
        ...lead,
        called: true,
        crm_status: 'contacted'
      });
      setEditorStatus('contacted');
      setEditorValidationError("CRM Conversation Logs & Notes and Follow Up Date are mandatory to promote this lead to 'Spoke to Owner'. Please enter them now.");
      setActiveTab('crm');
      return;
    }

    setCallingId(id);
    
    const originalLeads = [...leads];
    
    if (!showAll) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } else {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, called: true, called_at: new Date().toISOString(), crm_status: crmStatus || 'no_answer' } : l
        )
      );
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, called: true, crm_status: crmStatus || 'no_answer' }),
      });


      if (!res.ok) {
        throw new Error('Could not update lead status.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setLeads(originalLeads);
      setErrorText(error.message || 'Could not update lead status. Refreshed table.');
    } finally {
      setCallingId(null);
    }
  };


  // Geographic Keywords Lists matching scorer.ts geographic weightings
  const PREMIUM_KEYWORDS = ['bandra','koramangala','juhu','powai','worli','lower parel','indiranagar','south mumbai','andheri west','hiranandani','khan market','hauz khas','whitefield','connaught place'];
  const METRO_KEYWORDS = ['mumbai','delhi','bengaluru','bangalore','hyderabad','chennai','pune','kolkata','ahmedabad','gurgaon','gurugram','noida','surat','jaipur'];
  const TIER2_KEYWORDS = ['nagpur','indore','lucknow','bhopal','vadodara','coimbatore','kochi','patna','chandigarh','visakhapatnam','vizag','mysuru','mysore','rajkot','nashik','aurangabad'];

  // 1. Raw Leads Sources
  const prospectsSourceLeads = searchFilter
    ? leads.filter((lead) => lead.source?.toLowerCase().trim() === searchFilter.toLowerCase().trim())
    : leads;

  // CRM Search & Filters
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const crmSourceLeads = crmLeads.filter(l => {
    const matchesStatus = crmStatusFilter === 'all' || l.crm_status === crmStatusFilter;
    const matchesSearch = crmSearchQuery.trim() === '' || 
      l.name?.toLowerCase().includes(crmSearchQuery.toLowerCase()) || 
      l.phone?.includes(crmSearchQuery) || 
      l.source?.toLowerCase().includes(crmSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Choose source based on active tab
  const currentLeadsList = activeTab === 'prospects' ? prospectsSourceLeads : crmSourceLeads;

  // 2. Filter by Tier
  const filteredByTier = tierFilter === 'all' 
    ? currentLeadsList 
    : currentLeadsList.filter(l => (l.tier ?? l.problems?.tier) === tierFilter);

  // 3. Filter by Niche
  const filteredByNiche = nicheFilter === 'all' 
    ? filteredByTier 
    : filteredByTier.filter(lead => {
        const name = (lead.name || '').toLowerCase();
        const src  = (lead.source || '').toLowerCase();
        const nicheMap: Record<string, RegExp> = {
          clinic:      /dentist|dental|clinic|hospital|doctor|medical/i,
          real_estate: /real.?estate|builder|property|flat|apartment/i,
          gym:         /gym|fitness|yoga|wellness|spa|salon|beauty/i,
          restaurant:  /restaurant|cafe|food|dhaba|biryani|dining/i,
          consultant:  /lawyer|advocate|ca |chartered|consultant|tax/i,
          education:   /school|college|coaching|tuition|academy/i,
          retail:      /shop|store|retail|boutique|mart/i,
        };
        return nicheMap[nicheFilter]?.test(name + ' ' + src) ?? true;
      });

  // 4. Filter by City Geographies
  const filteredByCity = cityFilter === 'all' 
    ? filteredByNiche 
    : filteredByNiche.filter(l => {
        const addr = (l.address || '').toLowerCase();
        if (cityFilter === 'premium') return PREMIUM_KEYWORDS.some(k => addr.includes(k));
        if (cityFilter === 'metro') return METRO_KEYWORDS.some(k => addr.includes(k));
        if (cityFilter === 'tier2') return TIER2_KEYWORDS.some(k => addr.includes(k));
        return true;
      });

  // 5. Sorted Leads Pipeline
  const sortedLeads = [...filteredByCity].sort((a, b) => {
    if (sortBy === 'created_at') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    if (sortBy === 'deal_value') {
      return (b.deal_value || 0) - (a.deal_value || 0);
    }
    if (sortBy === 'priority_rank') {
      const aRank = a.priority_rank ?? 999999;
      const bRank = b.priority_rank ?? 999999;
      return aRank - bRank;
    }
    if (sortBy === 'intent_score') {
      const aVal = a.intent_score ?? a.problems?.intentNorm ?? 0;
      const bVal = b.intent_score ?? b.problems?.intentNorm ?? 0;
      return bVal - aVal;
    }
    if (sortBy === 'digital_gap_score') {
      const aVal = a.digital_gap_score ?? a.problems?.digitalGapNorm ?? 0;
      const bVal = b.digital_gap_score ?? b.problems?.digitalGapNorm ?? 0;
      return bVal - aVal;
    }
    
    // Default: quality score (score / final_score)
    const aVal = a.final_score ?? a.score ?? 0;
    const bVal = b.final_score ?? b.score ?? 0;
    return bVal - aVal;
  });

  // Calculate paginated leads for Prospects Tab
  const totalLeads = activeTab === 'prospects' ? sortedLeads.length : prospectsSourceLeads.length;
  const totalPages = Math.ceil(totalLeads / pageSize) || 1;
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLeads = activeTab === 'prospects' ? sortedLeads.slice(startIndex, endIndex) : [];

  // Calculate paginated CRM leads for CRM Tab
  const totalCrmLeads = activeTab === 'crm' ? sortedLeads.length : crmSourceLeads.length;
  const crmPages = Math.ceil(totalCrmLeads / pageSize) || 1;
  const activeCrmPage = Math.min(Math.max(1, currentPage), crmPages);
  const startCrmIdx = (activeCrmPage - 1) * pageSize;
  const paginatedCrmLeads = activeTab === 'crm' ? sortedLeads.slice(startCrmIdx, startCrmIdx + pageSize) : [];

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

  // 1. Loading Overlay state while syncing authentication session details
  if (isSyncingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans p-4">
        <div className="flex flex-col items-center space-y-4 max-w-[260px] w-full text-center">
          <div className="h-14 w-14 rounded border border-border flex items-center justify-center bg-background shadow-none relative mb-1 animate-pulse">
            <Image src="/logo_v2.png" alt="Aetheron Studio CRM" width={42} height={42} className="object-contain" style={{ width: '42px', height: '42px' }} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground tracking-tight flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
              Establishing secure session
            </p>
            <p className="text-[11px] text-muted-foreground">Verifying tokens and credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Minimalist Stock Shadcn Login screen when unauthenticated
  if (!session || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans p-4">
        <div className="w-full max-w-[400px] border border-border bg-card rounded-lg shadow-none p-6 sm:p-8 space-y-6 text-left">
          <div className="flex flex-col space-y-2">
            <div className="h-12 w-12 rounded border border-border flex items-center justify-center bg-background shadow-none mb-1">
              <Image src="/logo_v2.png" alt="Aetheron Studio CRM" width={38} height={38} className="object-contain" style={{ width: '38px', height: '38px' }} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Log in with your administrator account to access the scraping console, search history, and pipeline CRM.
            </p>
          </div>

          {errorText && (
            <Alert variant="destructive" className="rounded-lg shadow-none text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <AlertDescription>{errorText}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Button 
              onClick={handleGoogleSignIn} 
              variant="outline"
              className="w-full h-10 text-sm font-medium shadow-none hover:bg-accent hover:text-accent-foreground flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>

          <div className="text-[11px] text-muted-foreground/60 border-t border-border/60 pt-4 text-center">
            Aetheron Studio CRM &copy; {new Date().getFullYear()}. Secure OAuth Gateway.
          </div>
        </div>
      </div>
    );
  }

  // 3. Access Approval Pending Gateway Screen (polls sync profile every 5 seconds)
  if (profile.status === 'pending') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans p-4">
        <div className="w-full max-w-[400px] border border-border bg-card rounded-lg shadow-none p-6 sm:p-8 space-y-6 text-left">
          <div className="flex flex-col space-y-2">
            <div className="h-12 w-12 rounded border border-border flex items-center justify-center bg-background shadow-none mb-1">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Approval Pending</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Your email <span className="text-foreground font-semibold">{profile.email}</span> has been registered.
              </p>
              <p className="leading-relaxed">
                To protect databases and ensure system stability, all new accounts require verified administrator approval before seeing the main dashboard.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium border border-border">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Auto-checking approval status...</span>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button 
              onClick={() => syncProfile(session)} 
              variant="outline" 
              className="w-full h-10 text-sm font-medium shadow-none"
            >
              Check Approval Status
            </Button>
            <Button 
              onClick={handleSignOut} 
              variant="ghost" 
              className="w-full h-10 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              Sign Out / Switch Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Access Denied Portal for Disabled, Blocked, or Rejected profiles
  if (['rejected', 'disabled', 'blocked'].includes(profile.status)) {
    const isBlocked = profile.status === 'blocked';
    const isDisabled = profile.status === 'disabled';

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans p-4">
        <div className="w-full max-w-[400px] border border-border bg-card rounded-lg shadow-none p-6 sm:p-8 space-y-6 text-left">
          <div className="flex flex-col space-y-2">
            <div className="h-12 w-12 rounded border border-border flex items-center justify-center bg-background shadow-none mb-1">
              {isBlocked ? <Lock className="w-6 h-6 text-destructive" /> : <Ban className="w-6 h-6 text-destructive" />}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-destructive">
              {isBlocked ? 'Account Blocked' : isDisabled ? 'Account Suspended' : 'Access Denied'}
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Account ID: <span className="text-foreground font-semibold">{profile.email}</span>
              </p>
              <p className="leading-relaxed">
                {isBlocked 
                  ? 'This account has been permanently banned due to policy violations. Access is restricted.' 
                  : isDisabled 
                  ? 'Your account has been temporarily disabled by an administrator. Please contact your coordinator to resolve this suspension.' 
                  : 'Your request for access has been rejected by an administrator. Verification failed.'}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              className="w-full h-10 text-sm font-medium border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive shadow-none"
            >
              Sign Out of Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex font-sans antialiased text-foreground overflow-x-hidden w-full max-w-full relative">

      {/* Desktop Left Sidebar */}
      <aside className={`hidden lg:flex border-r border-border bg-card flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${
        leftSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <Link href="/" className={`h-16 border-b border-border flex items-center shrink-0 bg-card transition-all duration-300 hover:bg-muted/30 ${
          leftSidebarCollapsed ? 'px-4 justify-center' : 'px-6 gap-2.5'
        }`}>
          <Image src="/logo_v2.png" alt="Aetheron Studio CRM" width={36} height={36} className="rounded-lg object-contain shadow-sm border border-border/50" style={{ width: '36px', height: '36px' }} />
          {!leftSidebarCollapsed && <span className="text-sm font-bold text-foreground tracking-tight">Aetheron Studio CRM</span>}
        </Link>
        
        {/* Sidebar Navigation */}
        <nav className={`flex-grow py-6 space-y-1.5 transition-all duration-300 ${
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
            title={leftSidebarCollapsed ? "CRM" : undefined}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            {!leftSidebarCollapsed && <span>CRM</span>}
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

          {profile?.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all ${
                leftSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
              } ${
                activeTab === 'users'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
              title={leftSidebarCollapsed ? "User" : undefined}
            >
              <Users className="w-4 h-4 shrink-0" />
              {!leftSidebarCollapsed && <span>User</span>}
            </button>
          )}
        </nav>

        {/* Sidebar User Widget - Moved to Header */}

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
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80" onClick={() => setMobileMenuOpen(false)}>
              <Image src="/logo_v2.png" alt="Aetheron Studio CRM" width={36} height={36} className="rounded-lg object-contain shadow-sm border border-border/50" style={{ width: '36px', height: '36px' }} />
              <SheetTitle className="text-sm font-bold tracking-tight">Aetheron Studio CRM</SheetTitle>
            </Link>
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
              CRM
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

            {profile?.role === 'super_admin' && (
              <button
                onClick={() => {
                  setActiveTab('users');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                User
              </button>
            )}

          </nav>
        </SheetContent>
      </Sheet>

      {/* Main Page Workspace Layout Container */}
      <div className={`flex-1 flex flex-col min-h-screen overflow-x-hidden w-full max-w-full relative min-w-0 transition-all duration-300 ease-in-out ${
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
                <Link href="/" className="flex items-center gap-2 lg:hidden hover:opacity-80">
                  <Image src="/logo_v2.png" alt="Aetheron Studio CRM" width={36} height={36} className="rounded-lg object-contain shadow-sm border border-border/50" style={{ width: '36px', height: '36px' }} />
                </Link>
                <h1 className="text-sm font-bold text-foreground leading-none">
                  {activeTab === 'prospects' ? 'Prospects' : activeTab === 'crm' ? 'CRM' : activeTab === 'history' ? 'History' : 'User'}
                </h1>
              </div>
            </div>
            
            {/* Header Right Content: Active tab metrics, refresh quick actions, and user profile */}
            <div className="flex items-center gap-3">
              {activeTab === 'prospects' && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setRefreshTrigger((prev) => prev + 1);
                    setCurrentPage(1);
                  }}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Refresh Prospects"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLeads ? 'animate-spin text-primary' : ''}`} />
                </Button>
              )}

              {activeTab === 'crm' && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setCrmRefreshTrigger((prev) => prev + 1);
                    setCurrentPage(1);
                  }}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Sync CRM Database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCrm ? 'animate-spin text-emerald-600' : ''}`} />
                </Button>
              )}

              {activeTab === 'history' && (
                <>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border text-muted-foreground text-[10px] font-extrabold rounded-full">
                    <span>{history.length} SEARCHES</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      fetchHistory();
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Refresh Search History"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}

              {/* User Profile details & Logout option in Header */}
              {profile && (
                <div className="flex items-center gap-2.5 pl-3 border-l border-border h-8 shrink-0">
                  <SafeAvatar
                    src={profile.avatar_url}
                    name={profile.full_name}
                    email={profile.email}
                    className="w-8 h-8 rounded-full border border-border object-cover shadow-sm shrink-0"
                  />
                  <div className="hidden sm:flex flex-col text-left max-w-[120px] md:max-w-[150px]">
                    <span className="text-[11px] font-bold text-foreground truncate leading-tight">{profile.full_name || 'Active User'}</span>
                    <span className="text-[9px] text-muted-foreground truncate leading-none mt-0.5">{profile.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0 ml-1"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Content Space */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full space-y-6">
          {activeTab === 'prospects' && (
            <>
              {/* Dashboard Dynamic Real-time Stats Grid */}
              <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 animate-in fade-in duration-300">
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-primary shrink-0" /> Total Prospects
                    </span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{prospectsSourceLeads.length}</span>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Pending Calls
                    </span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{prospectsSourceLeads.filter(l => !l.called).length}</span>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0 animate-pulse" /> {"Hot Prospects (>=70)"}
                    </span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{prospectsSourceLeads.filter(l => l.score >= 70).length}</span>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Avg Quality
                    </span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">
                      {prospectsSourceLeads.length > 0 ? Math.round(prospectsSourceLeads.reduce((acc, l) => acc + l.score, 0) / prospectsSourceLeads.length) : 0}
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
                      {prospectsSourceLeads.filter(l => (l.tier ?? l.problems?.tier) === 'hot').length}
                    </span>
                  </CardContent>
                </Card>

                <Card className="border-purple-500/10 bg-purple-500/[0.02] hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-purple-500 shrink-0" /> Avg Intent Score
                    </span>
                    <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight block mt-1">
                      {(() => {
                        const validLeads = prospectsSourceLeads.filter(l => {
                          const intentVal = l.intent_score ?? l.problems?.intentNorm;
                          return intentVal !== undefined && intentVal !== null;
                        });
                        if (validLeads.length === 0) return 0;
                        const sum = validLeads.reduce((acc, l) => acc + (l.intent_score ?? l.problems?.intentNorm ?? 0), 0);
                        return Math.round(sum / validLeads.length);
                      })()}%
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
                          <TabsTrigger value="all"  className="text-xs font-semibold px-3">All</TabsTrigger>
                          <TabsTrigger value="hot"  className="text-xs font-semibold px-2.5">🔥 Hot</TabsTrigger>
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
                          <TabsTrigger value="low"  className="text-xs font-semibold px-3">Low</TabsTrigger>
                          <TabsTrigger value="all"  className="text-xs font-semibold px-3">All</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Called Status */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Status</span>
                      <Tabs value={showAll ? 'all' : 'uncalled'} onValueChange={(v) => { setShowAll(v === 'all'); setCurrentPage(1); }}>
                        <TabsList className="h-9">
                          <TabsTrigger value="uncalled" className="text-xs font-semibold px-3">Uncalled</TabsTrigger>
                          <TabsTrigger value="all"      className="text-xs font-semibold px-3">All Status</TabsTrigger>
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
                      <span className="ml-1 font-semibold text-foreground">{sortedLeads.length} leads matching</span>
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
                      currentPage={activePage}
                      pageSize={pageSize}
                      totalLeads={totalLeads}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                    />
                  </div>

                </CardContent>
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
                      <TabsList className="h-11 lg:h-9 w-max min-w-full lg:w-auto lg:min-w-0 flex flex-nowrap lg:flex-wrap items-center justify-start lg:justify-center border border-border p-1 rounded-lg bg-muted/40 whitespace-nowrap">
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
                    onUpdateLeadAction={handleUpdateCRMLead}
                    onOpenNotesAction={handleOpenLeadNotes}
                    isLoading={isLoadingCrm}
                    currentPage={activeCrmPage}
                    pageSize={pageSize}
                    totalLeads={totalCrmLeads}
                    onPageChangeAction={setCurrentPage}
                    onPageSizeChangeAction={setPageSize}
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
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        <th className="px-6 py-3.5">Query</th>
                        <th className="px-6 py-3.5 text-center">Live Prospects</th>
                        <th className="px-6 py-3.5 text-center">🔥 Hot Leads</th>
                        <th className="px-6 py-3.5 text-center">Avg Score</th>
                        <th className="px-6 py-3.5 text-center">Run Count</th>
                        <th className="px-6 py-3.5">Last Scrape Date</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate">
                            {item.query}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant="secondary" className="bg-primary/5 text-primary text-[10.5px] font-bold border-primary/10">
                              {item.live_count ?? 0} active
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {(item.hot_count ?? 0) > 0 ? (
                              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10.5px] font-extrabold border-rose-500/20 flex items-center justify-center gap-1 mx-auto w-fit">
                                <Flame className="w-3 h-3 text-rose-500 animate-pulse" /> {item.hot_count} hot
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/45 font-mono text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {(item.avg_score ?? 0) > 0 ? (
                              <Badge className={`text-[10.5px] font-bold mx-auto w-fit block ${
                                (item.avg_score ?? 0) >= 70
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              }`}>
                                {item.avg_score} avg
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/45 font-mono text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-muted-foreground">
                            {item.run_count}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground font-medium">
                            {new Date(item.last_run_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
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

          {activeTab === 'users' && profile?.role === 'super_admin' && (
            <>
              {/* User management stats card grid */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300">
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary shrink-0" /> Total Users
                    </span>
                    <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{users.length}</span>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Approved
                    </span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight block mt-1">
                      {users.filter(u => u.status === 'approved').length}
                    </span>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-pulse" /> Pending Approval
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight block mt-1">
                      {users.filter(u => u.status === 'pending').length}
                    </span>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Blocked/Suspended
                    </span>
                    <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight block mt-1">
                      {users.filter(u => ['blocked', 'disabled', 'rejected'].includes(u.status)).length}
                    </span>
                  </CardContent>
                </Card>
              </section>

              {/* User management control card */}
              <Card className="overflow-hidden animate-in fade-in duration-300">
                <CardHeader className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-bold leading-none flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Registered Member Profiles
                    </CardTitle>
                    <CardDescription className="text-[11px] mt-1">
                      Authorize new administrator requests, manage roles, suspension statuses, and track system registrations.
                    </CardDescription>
                  </div>
                  
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by email or name..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-9 h-8.5 text-xs"
                      />
                    </div>
                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                      <SelectTrigger className="w-full sm:w-36 h-8.5 text-xs">
                        <SelectValue placeholder="Filter Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>

                <div className="overflow-x-auto">
                  {(() => {
                    const filteredUsers = users.filter((u) => {
                      const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
                      const matchesSearch = userSearchQuery.trim() === '' ||
                        (u.full_name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase());
                      return matchesStatus && matchesSearch;
                    });

                    if (isLoadingUsers) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                          <p className="text-xs text-muted-foreground font-semibold">Retrieving user roster database...</p>
                        </div>
                      );
                    }

                    if (filteredUsers.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center m-6 border-2 border-dashed border-border rounded-2xl bg-card/40 backdrop-blur-sm animate-in fade-in duration-300">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                            <Users className="w-5.5 h-5.5 text-primary" />
                          </div>
                          <h3 className="font-extrabold text-base text-foreground tracking-tight">No Users Found</h3>
                          <p className="text-muted-foreground text-xs max-w-sm mt-2 leading-relaxed">
                            No member records matched your active search query or status filter parameters.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b border-border bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            <th className="px-6 py-3.5">User Details</th>
                            <th className="px-6 py-3.5">Role</th>
                            <th className="px-6 py-3.5">Current Status</th>
                            <th className="px-6 py-3.5">Joined Date</th>
                            <th className="px-6 py-3.5 text-right">Administrative Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-xs">
                          {filteredUsers.map((u) => {
                            const isSelf = u.id === session?.user?.id;
                            const isPrimaryAdmin = u.email?.toLowerCase() === (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@example.com').toLowerCase();

                            return (
                              <tr key={u.id} className={`hover:bg-muted/20 transition-colors ${isSelf ? 'bg-primary/[0.01]' : ''}`}>
                                <td className="px-6 py-4 flex items-center gap-3">
                                  <SafeAvatar
                                    src={u.avatar_url}
                                    name={u.full_name}
                                    email={u.email}
                                    className="w-8 h-8 rounded-full border border-border object-cover shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                                      {u.full_name || 'Active Member'}
                                      {isSelf && <Badge variant="outline" className="text-[8px] h-4 px-1 border-primary/30 text-primary bg-primary/5 uppercase font-extrabold tracking-wide">You</Badge>}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">{u.email}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {u.role === 'super_admin' ? (
                                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border-amber-500/20 uppercase tracking-wider flex items-center gap-1 w-fit">
                                      <Award className="w-3 h-3 text-amber-500" /> Super Admin
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider w-fit">
                                      Standard User
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge className={`text-[10px] font-extrabold uppercase tracking-wider w-fit flex items-center gap-1 ${
                                    u.status === 'approved'
                                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                      : u.status === 'pending'
                                      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse'
                                      : u.status === 'disabled'
                                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                      : u.status === 'blocked'
                                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                      : 'bg-muted text-muted-foreground border-border'
                                  }`}>
                                    {u.status === 'approved' && <ShieldCheck className="w-3 h-3" />}
                                    {u.status === 'pending' && <ShieldAlert className="w-3 h-3" />}
                                    {u.status === 'disabled' && <Ban className="w-3 h-3" />}
                                    {u.status === 'blocked' && <Lock className="w-3 h-3" />}
                                    {u.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground font-medium">
                                  {new Date(u.created_at).toLocaleString('en-IN', {
                                    dateStyle: 'medium',
                                  })}
                                </td>
                                <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                                  {/* Locking primary admin controls */}
                                  {isPrimaryAdmin ? (
                                    <span className="text-[10px] text-muted-foreground/60 font-semibold italic pr-2">System Protected</span>
                                  ) : (
                                    <>
                                      {u.status !== 'approved' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setConfirmDialogTitle('Approve Account Access');
                                            setConfirmDialogDesc(`Are you sure you want to approve access for ${u.email}? They will gain immediate entry to the prospects database and pipeline CRM.`);
                                            setConfirmDialogAction(() => () => {
                                              handleUpdateUserStatus(u.id, 'approved');
                                              setConfirmDialogOpen(false);
                                            });
                                            setConfirmDialogOpen(true);
                                          }}
                                          className="text-[10px] font-bold h-7 px-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        >
                                          Approve
                                        </Button>
                                      )}
                                      {u.status === 'pending' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setConfirmDialogTitle('Reject Request');
                                            setConfirmDialogDesc(`Are you sure you want to reject the registration request from ${u.email}?`);
                                            setConfirmDialogAction(() => () => {
                                              handleUpdateUserStatus(u.id, 'rejected');
                                              setConfirmDialogOpen(false);
                                            });
                                            setConfirmDialogOpen(true);
                                          }}
                                          className="text-[10px] font-bold h-7 px-2 bg-orange-500/5 hover:bg-orange-500/10 text-orange-600 border-orange-500/20"
                                        >
                                          Reject
                                        </Button>
                                      )}
                                      {u.status === 'approved' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setConfirmDialogTitle('Suspend User Access');
                                            setConfirmDialogDesc(`Are you sure you want to temporarily disable pipeline access for ${u.email}?`);
                                            setConfirmDialogAction(() => () => {
                                              handleUpdateUserStatus(u.id, 'disabled');
                                              setConfirmDialogOpen(false);
                                            });
                                            setConfirmDialogOpen(true);
                                          }}
                                          className="text-[10px] font-bold h-7 px-2 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 border-amber-500/20"
                                        >
                                          Suspend
                                        </Button>
                                      )}
                                      {u.status !== 'blocked' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setConfirmDialogTitle('Block User Account');
                                            setConfirmDialogDesc(`Are you sure you want to permanently block ${u.email}? This action is highly restrictive and logs an administrative ban.`);
                                            setConfirmDialogAction(() => () => {
                                              handleUpdateUserStatus(u.id, 'blocked');
                                              setConfirmDialogOpen(false);
                                            });
                                            setConfirmDialogOpen(true);
                                          }}
                                          className="text-[10px] font-bold h-7 px-2 hover:bg-rose-500/10 hover:text-rose-600"
                                        >
                                          Block
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </Card>
            </>
          )}

        </main>

        {/* Integrated Footer */}
        <footer className="bg-card border-t border-border py-4 text-center text-[10px] text-muted-foreground shrink-0 mt-auto">
          <div className="max-w-7xl mx-auto px-4">
            Aetheron Studio CRM &copy; {new Date().getFullYear()}.
          </div>
        </footer>

        {/* CRM Lead Notes & Editor — Shadcn Sheet */}
        <Sheet open={!!selectedCRMLead} onOpenChange={(open) => { if (!open) setSelectedCRMLead(null); }}>
          <SheetContent side="right" className={`${notesSidebarWide ? 'lg:max-w-4xl xl:max-w-5xl' : 'lg:max-w-xl'} w-full sm:max-w-lg md:max-w-xl p-0 flex flex-col h-full overflow-x-hidden transition-all duration-300`}>
            {/* Drawer Header */}
            <SheetHeader className="px-4 py-4 sm:px-6 sm:py-5 pr-16 border-b border-border shrink-0 bg-muted/20 space-y-1 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center gap-2">
                    <Badge className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                      Lead CRM Profile
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setNotesSidebarWide(!notesSidebarWide)}
                      className="h-7 w-7 hidden sm:flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-colors"
                      title={notesSidebarWide ? "Collapse notes panel" : "Expand notes panel"}
                    >
                      {notesSidebarWide ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <SheetTitle className="text-base font-bold truncate max-w-[220px] sm:max-w-md lg:max-w-lg">
                    {selectedCRMLead?.name}
                  </SheetTitle>
                </div>
              </div>
            </SheetHeader>
            <SheetDescription className="sr-only">Edit lead CRM details, notes, and outreach.</SheetDescription>

            {/* Drawer Scrollable Content */}
            <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${notesSidebarWide ? 'lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0' : 'space-y-6'}`}>
              {editorValidationError && (
                <div className="col-span-2 bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-200">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-destructive">Required Field Error</p>
                    <p className="text-xs font-medium text-destructive/90 leading-normal">{editorValidationError}</p>
                  </div>
                </div>
              )}
              
              {/* Left Column: Contact Enrichment & CRM Stats */}
              <div className="space-y-6">
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
                        className="h-11 lg:h-10 text-base lg:text-sm font-semibold"
                        placeholder="e.g. 9876543210"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground">Email Address</label>
                      <Input
                        type="email"
                        value={editorEmail}
                        onChange={(e) => setEditorEmail(e.target.value)}
                        className="h-11 lg:h-10 text-base lg:text-sm font-semibold"
                        placeholder="owner@business.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground">Website URL</label>
                      <Input
                        type="text"
                        value={editorWebsite}
                        onChange={(e) => setEditorWebsite(e.target.value)}
                        className="h-11 lg:h-10 text-base lg:text-sm font-semibold"
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
                    <Select value={editorStatus} onValueChange={(v) => {
                      setEditorStatus(v as typeof editorStatus);
                      setEditorValidationError(null);
                    }}>
                      <SelectTrigger className="h-11 lg:h-10 text-base lg:text-sm font-semibold">
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
                    <label className="text-xs font-bold text-foreground">
                      Est. Deal Value ($) {editorStatus === 'won' && <span className="text-rose-500 font-bold">*</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={editorValue}
                        onChange={(e) => setEditorValue(Number(e.target.value) || 0)}
                        className={`h-11 lg:h-10 text-base lg:text-sm font-bold pl-7 ${editorStatus === 'won' && !editorValue ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-500/5' : ''}`}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Follow-up / Meeting Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                      {editorStatus === 'meeting' ? (
                        <>
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span>Meeting Date <span className="text-rose-500 font-bold">*</span></span>
                        </>
                      ) : (
                        <>
                          <span>Next Follow-up Date {(editorStatus === 'contacted') && <span className="text-rose-500 font-bold">*</span>}</span>
                        </>
                      )}
                    </label>
                    <Input
                      type="date"
                      value={editorFollowUp}
                      onChange={(e) => setEditorFollowUp(e.target.value)}
                      className={`h-11 lg:h-10 text-base lg:text-sm font-semibold ${(editorStatus === 'contacted' || editorStatus === 'meeting') && !editorFollowUp ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-500/5' : ''}`}
                    />
                  </div>

                  {/* Meeting Link (Only for Meeting stage) */}
                  {editorStatus === 'meeting' && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-amber-500" />
                        <span>Meeting Link <span className="text-rose-500 font-bold">*</span></span>
                      </label>
                      <Input
                        type="text"
                        value={editorMeetingLink}
                        onChange={(e) => setEditorMeetingLink(e.target.value)}
                        className={`h-11 lg:h-10 text-base lg:text-sm font-semibold ${!editorMeetingLink ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-500/5' : ''}`}
                        placeholder="e.g. https://meet.google.com/abc-defg-hij"
                      />
                    </div>
                  )}

                  {/* Meeting Notes (Only for Meeting stage) */}
                  {editorStatus === 'meeting' && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1">
                        <Notebook className="w-3.5 h-3.5 text-amber-500" />
                        <span>Meeting Notes <span className="text-rose-500 font-bold">*</span></span>
                      </label>
                      <textarea
                        value={editorMeetingNotes}
                        onChange={(e) => setEditorMeetingNotes(e.target.value)}
                        rows={4}
                        className={`w-full text-base lg:text-sm font-medium bg-background border rounded-md p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed ${!editorMeetingNotes ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-500/5' : 'border-input'}`}
                        placeholder="Record agenda, key outcomes, meeting summary..."
                      />
                    </div>
                  )}

                  {/* CRM Notes (For all stages EXCEPT Meeting stage) */}
                  {editorStatus !== 'meeting' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1">
                        <Notebook className="w-3.5 h-3.5 text-muted-foreground" /> CRM Conversation Logs & Notes {editorStatus === 'contacted' && <span className="text-rose-500 font-bold">*</span>}
                      </label>
                      <textarea
                        value={editorNotes}
                        onChange={(e) => setEditorNotes(e.target.value)}
                        rows={5}
                        className={`w-full text-base lg:text-sm font-medium bg-background border rounded-md p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed ${editorStatus === 'contacted' && !editorNotes ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-500/5' : 'border-input'}`}
                        placeholder="Record call responses, specific requests, custom quote breakdowns..."
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Outreach Assistant */}
              <div className={`space-y-6 ${notesSidebarWide ? '' : 'pt-4 border-t border-border lg:pt-0 lg:border-t-0'}`}>
                {/* OUTREACH CHANNELS PREVIEW & EXECUTION */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block">
                    Outreach Assistant
                  </span>

                  {/* Template Selector — Shadcn Select */}
                  <Card className="bg-muted/30 border-border/50">
                    <CardContent className="p-4 space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Pitch Strategy Template
                      </label>
                      <Select value={selectedTemplateKey} onValueChange={handleTemplateChange}>
                        <SelectTrigger className="h-11 lg:h-10 text-base lg:text-sm font-semibold">
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
                    <CardContent className="p-4 space-y-2.5">
                      <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Message Pitch
                      </label>
                      <textarea
                        value={editorWAPitch}
                        onChange={(e) => setEditorWAPitch(e.target.value)}
                        rows={4}
                        className="w-full text-base lg:text-sm font-medium bg-background border border-input rounded-md p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed"
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
                          className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white p-0 flex items-center justify-center rounded-lg"
                          title="Send WhatsApp Message"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(editorWAPitch);
                            setCopiedWA(true);
                            setTimeout(() => setCopiedWA(false), 2000);
                          }}
                          className="h-9 px-3 text-xs font-bold border-emerald-600/20 text-emerald-600 hover:bg-emerald-600/5 flex items-center gap-1.5 rounded-lg"
                          title="Copy Message Text"
                        >
                          {copiedWA ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedWA ? 'Copied' : 'Copy'}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Template editor and Send/Copy Buttons */}
                  <Card className="bg-rose-500/5 border-rose-500/10">
                    <CardContent className="p-4 space-y-2.5">
                      <label className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> Email Pitch Customizer
                      </label>
                      <Input
                        type="text"
                        value={editorEmailSubject}
                        onChange={(e) => setEditorEmailSubject(e.target.value)}
                        className="h-11 lg:h-10 text-base lg:text-sm font-bold"
                        placeholder="Email Subject"
                      />
                      <textarea
                        value={editorEmailBody}
                        onChange={(e) => setEditorEmailBody(e.target.value)}
                        rows={5}
                        className="w-full text-base lg:text-sm font-medium bg-background border border-input rounded-md p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            const url = `mailto:${editorEmail}?subject=${encodeURIComponent(editorEmailSubject)}&body=${encodeURIComponent(editorEmailBody)}`;
                            window.open(url);
                          }}
                          className="h-9 w-9 bg-rose-500 hover:bg-rose-600 text-white p-0 flex items-center justify-center rounded-lg"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
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
                          className="h-9 px-3 text-xs font-bold border-rose-500/20 text-rose-500 hover:bg-rose-500/5 flex items-center gap-1.5 rounded-lg"
                          title="Copy Email Text"
                        >
                          {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-border shrink-0 bg-muted/10 grid grid-cols-2 gap-3">
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
            </div>
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
