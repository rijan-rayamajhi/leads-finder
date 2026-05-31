'use client';

import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Phone, 
  Mail, 
  Calendar, 
  TrendingUp, 
  MessageCircle, 
  Star, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserCheck,
  RefreshCw,
  Notebook,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BadgeInfo,
  MapPin
} from 'lucide-react';
import React, { useState } from 'react';

type CRMLeadsTableProps = {
  leads: Lead[];
  onUpdateLead: (id: number, fields: Partial<Lead>) => Promise<void>;
  onOpenNotes: (lead: Lead) => void;
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalLeads: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

interface LeadReasonMetadata {
  text: string;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  maps_url: string | null;
}

function parseLeadReason(rawReason: string): LeadReasonMetadata {
  try {
    if (rawReason && rawReason.startsWith('{')) {
      const parsed = JSON.parse(rawReason);
      return {
        text: parsed.text || '',
        address: parsed.address || null,
        rating: parsed.rating != null ? Number(parsed.rating) : null,
        reviews: parsed.reviews != null ? Number(parsed.reviews) : null,
        maps_url: parsed.maps_url || null,
      };
    }
  } catch (err) {
    console.error('Failed to parse lead reason JSON:', err);
  }
  return {
    text: rawReason || '',
    address: null,
    rating: null,
    reviews: null,
    maps_url: null,
  };
}

const CRM_STATUSES = [
  { value: 'no_answer', label: 'Attempted / No Answer', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  { value: 'contacted', label: 'Spoke to Owner', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  { value: 'meeting', label: 'Meeting Scheduled', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { value: 'won', label: 'Closed Won', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { value: 'lost', label: 'Closed Lost', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
];

function AuditChecklist({ reasonText, score }: { reasonText: string; score: number }) {
  const normalized = reasonText.toLowerCase();
  
  let websiteStatus: 'none' | 'broken' | 'ok' = 'ok';
  let websiteLabel = 'Website Active';
  let websitePoints = 0;
  
  if (normalized.includes('no website')) {
    websiteStatus = 'none';
    websiteLabel = 'No Website';
    websitePoints = 60;
  } else if (normalized.includes('broken website')) {
    websiteStatus = 'broken';
    websiteLabel = 'Broken / Offline Website';
    websitePoints = 40;
  }

  const hasNoContactForm = normalized.includes('no contact form');
  const hasNoEmail = normalized.includes('no email');
  const hasWeakContent = normalized.includes('weak content');

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <BadgeInfo className="w-4 h-4 text-primary" /> Audit Opportunity Report
        </h4>
        <Badge variant="secondary" className="text-[10px] font-bold">
          Total Score: {score}/100
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Card className={`${
          websiteStatus === 'none' 
            ? 'bg-rose-500/5 border-rose-500/20' 
            : websiteStatus === 'broken'
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-emerald-500/5 border-emerald-500/20'
        }`}>
          <CardContent className="p-3 flex flex-col justify-between h-20 text-xs">
            <div className="flex justify-between items-start">
              <span className="font-bold uppercase text-[9px] tracking-wider text-muted-foreground">Web Domain</span>
              <span className="font-extrabold text-[10px]">
                {websitePoints > 0 ? `+${websitePoints} pts` : '0 pts'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-semibold">
              {websiteStatus !== 'ok' ? (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span className="text-foreground truncate">{websiteLabel}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`${
          hasNoContactForm 
            ? 'bg-rose-500/5 border-rose-500/20' 
            : 'bg-emerald-500/5 border-emerald-500/20'
        }`}>
          <CardContent className="p-3 flex flex-col justify-between h-20 text-xs">
            <div className="flex justify-between items-start">
              <span className="font-bold uppercase text-[9px] tracking-wider text-muted-foreground">Contact Form</span>
              <span className="font-extrabold text-[10px]">
                {hasNoContactForm ? '+15 pts' : '0 pts'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-semibold">
              {hasNoContactForm ? (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span className="text-foreground truncate">{hasNoContactForm ? 'No Form Detected' : 'Form Detected'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`${
          hasNoEmail 
            ? 'bg-rose-500/5 border-rose-500/20' 
            : 'bg-emerald-500/5 border-emerald-500/20'
        }`}>
          <CardContent className="p-3 flex flex-col justify-between h-20 text-xs">
            <div className="flex justify-between items-start">
              <span className="font-bold uppercase text-[9px] tracking-wider text-muted-foreground">Email Capture</span>
              <span className="font-extrabold text-[10px]">
                {hasNoEmail ? '+10 pts' : '0 pts'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-semibold">
              {hasNoEmail ? (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span className="text-foreground truncate">{hasNoEmail ? 'No Public Email' : 'Email Active'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`${
          hasWeakContent 
            ? 'bg-rose-500/5 border-rose-500/20' 
            : 'bg-emerald-500/5 border-emerald-500/20'
        }`}>
          <CardContent className="p-3 flex flex-col justify-between h-20 text-xs">
            <div className="flex justify-between items-start">
              <span className="font-bold uppercase text-[9px] tracking-wider text-muted-foreground">Content Quality</span>
              <span className="font-extrabold text-[10px]">
                {hasWeakContent ? '+10 pts' : '0 pts'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-semibold">
              {hasWeakContent ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span className="text-foreground truncate">{hasWeakContent ? 'Thin Website Content' : 'Rich Content Quality'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CRMLeadsTable({
  leads,
  onUpdateLead,
  onOpenNotes,
  isLoading,
  currentPage,
  pageSize,
  totalLeads,
  onPageChange,
  onPageSizeChange
}: CRMLeadsTableProps) {
  const [editingValueId, setEditingValueId] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertLeadId, setRevertLeadId] = useState<number | null>(null);

  const toggleRow = (id: number) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  const handleRevertConfirm = () => {
    if (revertLeadId !== null) {
      onUpdateLead(revertLeadId, { called: false });
    }
    setRevertDialogOpen(false);
    setRevertLeadId(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (totalLeads === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center m-6 border-2 border-dashed border-border rounded-2xl bg-card/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-sm animate-pulse">
          <UserCheck className="w-5.5 h-5.5 text-primary" />
        </div>
        <h3 className="font-extrabold text-base text-foreground tracking-tight">Your Pipeline is Empty</h3>
        <p className="text-muted-foreground text-xs max-w-sm mt-2 leading-relaxed">
          Promote hot prospects into your CRM workspace. Go to the <span className="font-bold text-primary">Prospects</span> tab, find a qualified business opportunity, and click the <span className="font-bold text-foreground">&quot;Mark Called&quot;</span> action button.
        </p>
        <div className="flex items-center gap-2 mt-5 text-[10px] text-muted-foreground font-semibold bg-muted/60 border border-border px-3 py-1 rounded-full">
          <span>💼 Deal tracking, CRM logs & outreach automation active</span>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalLeads / pageSize) || 1;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const getOutreachLinks = (lead: Lead) => {
    const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
    const name = lead.name || 'Business Owner';
    
    const brokenSiteText = lead.website 
      ? `your website (${lead.website}) appears to be broken or offline` 
      : 'your business does not seem to have an active website';

    const subject = encodeURIComponent(`Improving Online Visibility for ${name}`);
    const emailBody = encodeURIComponent(
      `Hi ${name},\n\nI recently came across your business listing. I noticed that ${brokenSiteText}, which could be causing you to miss out on local customers looking for your services.\n\nI specialize in helping local businesses launch fast, mobile-friendly websites that turn web visitors into paying customers.\n\nAre you available for a brief, 5-minute phone call this week to see how we can fix this?\n\nBest regards,\n[Your Name]`
    );

    const waText = encodeURIComponent(
      `Hi ${name}, I noticed that ${brokenSiteText}. I build high-converting websites for businesses. Let me know if you would be open to a quick call to look at potential fixes.`
    );

    const emailRecipient = lead.email || '';
    return {
      tel: lead.phone ? `tel:${lead.phone}` : '#',
      wa: cleanPhone ? `https://wa.me/91${cleanPhone}?text=${waText}` : '#',
      mail: `mailto:${emailRecipient}?subject=${subject}&body=${emailBody}`
    };
  };

  const getFollowUpStatus = (dateStr?: string | null) => {
    if (!dateStr) return { label: 'No Date', color: 'text-muted-foreground' };
    
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    const formatted = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    if (compareDate.getTime() < today.getTime()) {
      return { label: `Overdue (${formatted})`, color: 'text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20' };
    }
    if (compareDate.getTime() === today.getTime()) {
      return { label: `Due Today (${formatted})`, color: 'text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse' };
    }
    return { label: formatted, color: 'text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded border border-border' };
  };

  return (
    <div>
      {/* Mobile Card Layout */}
      <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
        {leads.map((lead, index) => {
          const meta = parseLeadReason(lead.reason);
          const outreach = getOutreachLinks(lead);
          const fu = getFollowUpStatus(lead.follow_up_at);
          const isExpanded = expandedRowId === lead.id;
          
          return (
            <Card
              key={lead.id}
              className={`relative overflow-hidden transition-all duration-200 ${
                isExpanded ? 'ring-1 ring-primary/20 border-primary/20' : ''
              }`}
            >
              <div className="absolute top-0 left-0 bg-muted px-2 py-0.5 rounded-br-lg text-[9px] font-bold text-muted-foreground border-r border-b border-border">
                #{(currentPage - 1) * pageSize + index + 1}
              </div>
              <CardContent className="p-5 space-y-4">
                {/* Title & Score */}
                <div className="flex justify-between items-start gap-2 pt-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-foreground leading-tight">{lead.name}</h3>
                    {meta.rating !== null && (
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{meta.rating} ({meta.reviews || 0} reviews)</span>
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5 pt-1 font-medium">
                      {lead.phone && <span className="flex items-center gap-1">📞 {lead.phone}</span>}
                      {lead.email && <span className="flex items-center gap-1 text-rose-500">✉️ {lead.email}</span>}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                    Score: {lead.score}
                  </Badge>
                </div>

                {/* CRM controls */}
                <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Pipeline Stage</span>
                    <Select 
                      value={lead.crm_status || 'no_answer'} 
                      onValueChange={(v) => onUpdateLead(lead.id, { crm_status: v as Lead['crm_status'] })}
                    >
                      <SelectTrigger className="h-8 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CRM_STATUSES.map(st => (
                          <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Est. Deal Value</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={lead.deal_value || 0}
                        onChange={(e) => onUpdateLead(lead.id, { deal_value: Number(e.target.value) || 0 })}
                        className="w-full h-8 text-xs font-bold pl-5 pr-2 bg-background border border-input rounded-md focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Follow-up and Notes Preview */}
                <div className="space-y-2 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
                      <Calendar className="w-3.5 h-3.5" /> Next Follow-up
                    </span>
                    <span className={`text-xs ${fu.color}`}>{fu.label}</span>
                  </div>

                  {lead.notes && (
                    <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
                        <Notebook className="w-3 h-3 text-muted-foreground" /> Latest Note
                      </p>
                      <p className="italic text-foreground line-clamp-2 leading-relaxed">{lead.notes}</p>
                    </div>
                  )}
                </div>

                {/* View Audit Report Action toggle */}
                <Button
                  variant="outline"
                  onClick={() => toggleRow(lead.id)}
                  className="w-full text-xs font-bold bg-primary/5 hover:bg-primary/10 border-primary/10 text-primary"
                >
                  <span>{isExpanded ? 'Hide Audit Report' : 'Inspect Audit Report'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  )}
                </Button>

                {isExpanded && (
                  <div className="space-y-4 pt-3 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                    <AuditChecklist reasonText={meta.text} score={lead.score} />

                    {meta.address && (
                      <div className="flex items-start gap-2 bg-muted/40 p-3 rounded-lg border border-border/50 text-xs">
                        <MapPin className="w-4 h-4 text-rose-500 fill-rose-500/10 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-normal">
                          <strong>Address:</strong> {meta.address}
                        </span>
                      </div>
                    )}

                    {meta.maps_url && (
                      <Button variant="outline" asChild className="w-full text-xs font-bold border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10">
                        <a href={meta.maps_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1.5" />
                          View Google Maps Listing
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
                  <Button variant="outline" size="icon" asChild className="h-9 text-primary">
                    <a href={outreach.tel}><Phone className="w-4 h-4" /></a>
                  </Button>
                  <Button variant="outline" size="icon" asChild className="h-9 text-emerald-600">
                    <a href={outreach.wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4" /></a>
                  </Button>
                  <Button variant="outline" size="icon" asChild className="h-9 text-rose-500">
                    <a href={outreach.mail}><Mail className="w-4 h-4" /></a>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => onOpenNotes(lead)} 
                    className="h-9 w-full text-xs font-bold gap-1 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                  >
                    <Notebook className="w-3.5 h-3.5" /> Notes
                  </Button>
                </div>

                {/* Reset to uncalled */}
                <button
                  onClick={() => {
                    setRevertLeadId(lead.id);
                    setRevertDialogOpen(true);
                  }}
                  className="w-full text-center text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1 py-1"
                >
                  <RefreshCw className="w-3 h-3" /> Revert back to Prospects
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4"></TableHead>
              <TableHead className="w-12 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">S.N.</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-1/4">Business Details</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-44">Pipeline Stage</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-36">Est. Revenue</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-40 text-center">Follow Up Date</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-44 text-center">Outreach Channels</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-1/4">Latest Call Notes</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground pr-4 w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead, index) => {
              const meta = parseLeadReason(lead.reason);
              const outreach = getOutreachLinks(lead);
              const fu = getFollowUpStatus(lead.follow_up_at);
              const isExpanded = expandedRowId === lead.id;
              
              return (
                <React.Fragment key={lead.id}>
                  <TableRow
                    className={`group hover:bg-muted/10 transition-colors duration-200 border-b border-muted/30 ${
                      isExpanded ? 'bg-muted/5' : ''
                    }`}
                  >
                    <TableCell className="py-4 pl-4 w-10 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRow(lead.id)}
                        className="h-7 w-7"
                        title={isExpanded ? "Hide detailed audit" : "Inspect marketing audit details"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-primary" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-semibold text-muted-foreground text-center py-4 text-xs">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="flex flex-col gap-0.5 max-w-sm">
                        <span className="font-bold text-foreground text-sm leading-snug">{lead.name || 'N/A'}</span>
                        {meta.rating !== null && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-bold mt-0.5">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{meta.rating}</span>
                            <span className="text-muted-foreground font-normal">({meta.reviews || 0} reviews)</span>
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground flex flex-col gap-0.5 mt-1 font-medium">
                          {lead.phone && <span className="flex items-center gap-1">📞 {lead.phone}</span>}
                          {lead.email && <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">✉️ {lead.email}</span>}
                        </div>
                        {lead.website ? (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition-colors font-semibold text-xs mt-1 truncate"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {lead.website}
                          </a>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] w-fit mt-1">No Website</Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Dropdown — Shadcn Select */}
                    <TableCell className="py-4">
                      <Select 
                        value={lead.crm_status || 'no_answer'}
                        onValueChange={(v) => onUpdateLead(lead.id, { crm_status: v as Lead['crm_status'] })}
                      >
                        <SelectTrigger className="h-8 text-xs font-semibold w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CRM_STATUSES.map(st => (
                            <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Deal Value */}
                    <TableCell className="py-4">
                      {editingValueId === lead.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in duration-100">
                          <span className="text-xs font-bold text-muted-foreground">$</span>
                          <input
                            type="number"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={async () => {
                              setEditingValueId(null);
                              await onUpdateLead(lead.id, { deal_value: Number(tempValue) || 0 });
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                setEditingValueId(null);
                                await onUpdateLead(lead.id, { deal_value: Number(tempValue) || 0 });
                              }
                            }}
                            className="w-20 h-7 text-xs font-bold border border-input bg-background rounded-md px-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingValueId(lead.id);
                            setTempValue(String(lead.deal_value || 0));
                          }}
                          className="flex items-center gap-1 cursor-pointer hover:bg-muted/40 p-1.5 rounded border border-transparent hover:border-border/50 w-fit transition-all"
                          title="Click to edit deal value"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-extrabold text-foreground">
                            ${(lead.deal_value || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {/* Follow-up Alerts */}
                    <TableCell className="py-4 text-center">
                      <span className={`text-xs ${fu.color}`}>{fu.label}</span>
                    </TableCell>

                    {/* Outreach Quick Links */}
                    <TableCell className="py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 border border-border/80 p-1 rounded-lg bg-muted/20">
                        {lead.phone ? (
                          <Button variant="outline" size="icon" asChild className="h-7 w-7">
                            <a href={outreach.tel} title={`Call client: ${lead.phone}`}>
                              <Phone className="w-3.5 h-3.5 text-primary" />
                            </a>
                          </Button>
                        ) : (
                          <span className="h-7 w-7 flex items-center justify-center text-muted-foreground/30 text-xs">-</span>
                        )}

                        {lead.phone ? (
                          <Button variant="outline" size="icon" asChild className="h-7 w-7">
                            <a href={outreach.wa} target="_blank" rel="noopener noreferrer" title="Open pre-filled WhatsApp audit script">
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            </a>
                          </Button>
                        ) : (
                          <span className="h-7 w-7 flex items-center justify-center text-muted-foreground/30 text-xs">-</span>
                        )}

                        <Button variant="outline" size="icon" asChild className="h-7 w-7">
                          <a href={outreach.mail} title="Send customizable cold pitch email template">
                            <Mail className="w-3.5 h-3.5 text-rose-500" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>

                    {/* Notes Preview */}
                    <TableCell className="py-4 text-xs max-w-[220px]">
                      <span className="text-muted-foreground line-clamp-2 leading-relaxed italic" title={lead.notes || 'No notes taken yet.'}>
                        {lead.notes || 'No notes taken yet. Click notes button or double-click row to add notes.'}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-4 text-right pr-4 space-x-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenNotes(lead)}
                        className="text-[10px] font-bold h-7 px-2.5 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                      >
                        <Notebook className="w-3 h-3 mr-1" /> Note History
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setRevertLeadId(lead.id);
                          setRevertDialogOpen(true);
                        }}
                        className="h-7 w-7 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="Move back to prospects"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-muted/5 hover:bg-muted/5 border-b border-muted/30 animate-in fade-in duration-200">
                      <TableCell colSpan={9} className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          <div className="lg:col-span-7">
                            <Card>
                              <CardContent className="p-5">
                                <AuditChecklist reasonText={meta.text} score={lead.score} />
                              </CardContent>
                            </Card>
                          </div>
                          <div className="lg:col-span-5">
                            <Card>
                              <CardContent className="p-5 flex flex-col justify-between space-y-4">
                                <div className="space-y-3.5">
                                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-2">
                                    <MapPin className="w-4 h-4 text-rose-500 fill-rose-500/10" /> Location & Places Insights
                                  </h4>
                                  
                                  {meta.address ? (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Physical Address</span>
                                      <span className="text-xs font-semibold text-foreground leading-normal block">{meta.address}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">No address metadata found.</span>
                                  )}

                                  {meta.rating !== null && (
                                    <div className="space-y-1 pt-1.5">
                                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Google Places Rating</span>
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center text-amber-500 font-bold text-sm">
                                          <Star className="w-4 h-4 fill-current mr-1" />
                                          {meta.rating}
                                        </div>
                                        <span className="text-xs text-muted-foreground">({meta.reviews || 0} customer reviews)</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-3 border-t border-border flex flex-col sm:flex-row gap-2.5">
                                  {meta.maps_url && (
                                    <Button variant="outline" asChild className="flex-1 text-xs font-bold border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10">
                                      <a href={meta.maps_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4 mr-1.5" />
                                        View on Google Maps
                                      </a>
                                    </Button>
                                  )}
                                  
                                  {lead.phone && (
                                    <Button variant="outline" asChild className="flex-1 text-xs font-bold border-primary/20 text-primary bg-primary/5 hover:bg-primary/10">
                                      <a href={`tel:${lead.phone}`}>
                                        <Phone className="w-4 h-4 mr-1.5" />
                                        Call Business
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="border-t border-border px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
        <div className="text-xs text-muted-foreground font-medium">
          Showing <span className="font-semibold text-foreground">{Math.min(totalLeads, (currentPage - 1) * pageSize + 1)}</span> to{' '}
          <span className="font-semibold text-foreground">{Math.min(totalLeads, currentPage * pageSize)}</span> of{' '}
          <span className="font-semibold text-foreground">{totalLeads}</span> CRM prospects
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Rows per page:</span>
            <div className="flex items-center gap-1 bg-muted/40 border border-border p-0.5 rounded-lg">
              {[10, 25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => onPageSizeChange(size)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    pageSize === size
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers().map((p, idx) => (
                typeof p === 'number' ? (
                  <Button
                    key={idx}
                    variant={currentPage === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(p)}
                    className="h-8 min-w-[32px] px-2 text-xs font-bold"
                  >
                    {p}
                  </Button>
                ) : (
                  <span key={idx} className="px-1 text-xs font-semibold text-muted-foreground">
                    {p}
                  </span>
                )
              ))}
            </div>

            <span className="sm:hidden text-xs font-semibold text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>

            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Revert Confirmation Dialog */}
      <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revert Lead to Prospects</DialogTitle>
            <DialogDescription>
              This will move the lead back to the Prospects tab and reset its called status. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRevertDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevertConfirm}>Revert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
