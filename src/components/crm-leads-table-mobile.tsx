import React from 'react';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageCircle, 
  Star, 
  ExternalLink,
  RefreshCw,
  Notebook,
  ChevronDown,
  ChevronUp,
  MapPin,
  Video,
  AlertTriangle
} from 'lucide-react';
import { AuditChecklist, parseLeadReason, getTierBadge } from '@/components/audit-checklist';

type CRMLeadsTableMobileProps = {
  leads: Lead[];
  onUpdateLeadAction: (id: number, fields: Partial<Lead>) => Promise<void>;
  onOpenNotesAction: (lead: Lead) => void;
  currentPage: number;
  pageSize: number;
  expandedRowId: number | null;
  toggleRow: (id: number) => void;
  onRevertTrigger: (id: number) => void;
};

const CRM_STATUSES = [
  { value: 'no_answer', label: 'Attempted / No Answer', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  { value: 'contacted', label: 'Spoke to Owner', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  { value: 'meeting', label: 'Meeting Scheduled', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { value: 'won', label: 'Closed Won', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { value: 'lost', label: 'Closed Lost', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
];

const checkIsUpdateRequired = (lead: Lead) => {
  if (lead.crm_status === 'contacted') {
    return !lead.notes?.trim() || !lead.follow_up_at;
  }
  if (lead.crm_status === 'meeting') {
    return !lead.meeting_notes?.trim() || !lead.follow_up_at || !lead.meeting_link?.trim();
  }
  if (lead.crm_status === 'won') {
    return !lead.deal_value || lead.deal_value <= 0;
  }
  return false;
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

// Memoized individual mobile CRM card component
const CRMLeadMobileCard = React.memo(function CRMLeadMobileCardComponent({
  lead,
  index,
  currentPage,
  pageSize,
  isExpanded,
  toggleRow,
  onUpdateLead,
  onOpenNotes,
  onRevertTrigger
}: {
  lead: Lead;
  index: number;
  currentPage: number;
  pageSize: number;
  isExpanded: boolean;
  toggleRow: (id: number) => void;
  onUpdateLead: (id: number, fields: Partial<Lead>) => Promise<void>;
  onOpenNotes: (lead: Lead) => void;
  onRevertTrigger: (id: number) => void;
}) {
  const meta = parseLeadReason(lead.reason);
  const outreach = getOutreachLinks(lead);
  const fu = getFollowUpStatus(lead.follow_up_at);

  const handleToggle = React.useCallback(() => toggleRow(lead.id), [lead.id, toggleRow]);
  const handleOpenNotes = React.useCallback(() => onOpenNotes(lead), [lead, onOpenNotes]);
  const handleRevert = React.useCallback(() => onRevertTrigger(lead.id), [lead.id, onRevertTrigger]);
  
  const handleStatusChange = React.useCallback((v: string) => {
    onUpdateLead(lead.id, { crm_status: v as Lead['crm_status'] });
  }, [lead.id, onUpdateLead]);

  const handleValueChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateLead(lead.id, { deal_value: Number(e.target.value) || 0 });
  }, [lead.id, onUpdateLead]);

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${
        isExpanded ? 'ring-1 ring-primary/20 border-primary/20' : ''
      }`}
    >
      <div className="absolute top-0 left-0 bg-muted px-2 py-0.5 rounded-br-lg text-[9px] font-bold text-muted-foreground border-r border-b border-border flex items-center gap-1.5">
        <span>#{(currentPage - 1) * pageSize + index + 1}</span>
        {lead.created_at && (
          <span className="text-[8px] font-medium text-muted-foreground/80 border-l border-border/60 pl-1.5">
            {new Date(lead.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <CardContent className="p-5 space-y-4">
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
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
              Score: {lead.score}
            </Badge>
            {(() => {
              const badge = getTierBadge(lead.tier ?? lead.problems?.tier);
              return (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                  {badge.label}
                </span>
              );
            })()}
          </div>
        </div>

        <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Pipeline Stage</span>
            <Select 
              value={lead.crm_status || 'no_answer'} 
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="h-11 lg:h-10 text-xs lg:text-sm font-semibold">
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
                onChange={handleValueChange}
                className="w-full h-11 lg:h-10 text-xs lg:text-sm font-bold pl-5 pr-2 bg-background border border-input rounded-md focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {checkIsUpdateRequired(lead) && (
          <Button
            variant="outline"
            onClick={handleOpenNotes}
            className="w-full h-10 text-[10px] font-bold border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 flex items-center justify-center gap-1.5 rounded-lg animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Update Required: Missing Stage Details</span>
          </Button>
        )}

        <div className="space-y-2 text-xs text-muted-foreground pt-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
              <Calendar className="w-3.5 h-3.5" /> Next Follow-up
            </span>
            <span className={`text-xs ${fu.color}`}>{fu.label}</span>
          </div>

          {lead.crm_status === 'meeting' && lead.meeting_notes ? (
            <div className="bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10 space-y-1.5 animate-in fade-in duration-200">
              <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1">
                <Video className="w-3 h-3 text-amber-500" /> Meeting Notes
              </p>
              <p className="italic text-foreground line-clamp-2 leading-relaxed text-xs">{lead.meeting_notes}</p>
              {lead.meeting_link && (
                <a
                  href={lead.meeting_link.startsWith('http') ? lead.meeting_link : `https://${lead.meeting_link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline pt-0.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Join Meeting Link
                </a>
              )}
            </div>
          ) : lead.notes ? (
            <div className="bg-muted/40 p-2.5 rounded-lg border border-border/40">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
                <Notebook className="w-3 h-3 text-muted-foreground" /> Latest Note
              </p>
              <p className="italic text-foreground line-clamp-2 leading-relaxed text-xs">{lead.notes}</p>
            </div>
          ) : null}
        </div>

        <Button
          variant="outline"
          onClick={handleToggle}
          className="w-full h-11 text-xs font-bold bg-primary/5 hover:bg-primary/10 border-primary/10 text-primary flex items-center justify-between px-4"
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
            <AuditChecklist 
              lead={lead}
              reasonText={meta.text} 
              score={lead.score} 
              revenueScore={lead.revenue_score}
              contactScore={lead.contact_score}
              intentNorm={lead.problems?.intentNorm ?? lead.intent_score ?? 0}
              digitalGapNorm={lead.problems?.digitalGapNorm ?? lead.digital_gap_score ?? 0}
            />

            {meta.address && (
              <div className="flex items-start gap-2 bg-muted/40 p-3 rounded-lg border border-border/50 text-xs">
                <MapPin className="w-4 h-4 text-rose-500 fill-rose-500/10 shrink-0 mt-0.5" />
                <span className="text-muted-foreground leading-normal">
                  <strong>Address:</strong> {meta.address}
                </span>
              </div>
            )}

            {meta.maps_url && (
              <Button variant="outline" asChild className="w-full h-11 text-xs font-bold border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 flex items-center justify-center">
                <a href={meta.maps_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  View Google Maps Listing
                </a>
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            {lead.phone ? (
              <Button variant="outline" size="icon" asChild className="h-10 w-10 text-primary">
                <a href={outreach.tel} className="flex items-center justify-center"><Phone className="w-4 h-4" /></a>
              </Button>
            ) : (
              <span className="h-10 w-10 flex items-center justify-center text-muted-foreground/30 text-xs border border-dashed border-border rounded-lg">-</span>
            )}
            {lead.phone ? (
              <Button variant="outline" size="icon" asChild className="h-10 w-10 text-emerald-600">
                <a href={outreach.wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center"><MessageCircle className="w-4 h-4" /></a>
              </Button>
            ) : (
              <span className="h-10 w-10 flex items-center justify-center text-muted-foreground/30 text-xs border border-dashed border-border rounded-lg">-</span>
            )}
            <Button variant="outline" size="icon" asChild className="h-10 w-10 text-rose-500">
              <a href={outreach.mail} className="flex items-center justify-center"><Mail className="w-4 h-4" /></a>
            </Button>
          </div>
          <Button 
            variant="outline"
            onClick={handleOpenNotes} 
            className="h-10 text-xs font-bold gap-1 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary flex items-center justify-center px-3"
          >
            <Notebook className="w-3.5 h-3.5" /> <span>Notes</span>
          </Button>
        </div>

        <button
          onClick={handleRevert}
          className="w-full text-center text-xs font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1 py-3 mt-1.5"
        >
          <RefreshCw className="w-3 h-3" /> Revert back to Prospects
        </button>
      </CardContent>
    </Card>
  );
});

export const CRMLeadsTableMobile = React.memo(function CRMLeadsTableMobileComponent({
  leads,
  onUpdateLeadAction,
  onOpenNotesAction,
  currentPage,
  pageSize,
  expandedRowId,
  toggleRow,
  onRevertTrigger
}: CRMLeadsTableMobileProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {leads.map((lead, index) => (
        <CRMLeadMobileCard
          key={lead.id}
          lead={lead}
          index={index}
          currentPage={currentPage}
          pageSize={pageSize}
          isExpanded={expandedRowId === lead.id}
          toggleRow={toggleRow}
          onUpdateLead={onUpdateLeadAction}
          onOpenNotes={onOpenNotesAction}
          onRevertTrigger={onRevertTrigger}
        />
      ))}
    </div>
  );
});
