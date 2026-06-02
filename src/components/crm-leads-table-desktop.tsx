import React, { useState } from 'react';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  TrendingUp, 
  MessageCircle, 
  Star, 
  ExternalLink,
  RefreshCw,
  Notebook,
  ChevronDown,
  ChevronUp,
  MapPin,
  Globe,
  Video,
  AlertTriangle
} from 'lucide-react';
import { AuditChecklist, parseLeadReason } from '@/components/audit-checklist';

type CRMLeadsTableDesktopProps = {
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

// Memoized individual CRM desktop row
const CRMLeadRow = React.memo(function CRMLeadRowComponent({
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

  // Isolate value input state locally inside the row to avoid parent re-renders during typing
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [tempValue, setTempValue] = useState(String(lead.deal_value || 0));

  const handleToggle = React.useCallback(() => toggleRow(lead.id), [lead.id, toggleRow]);
  const handleOpenNotes = React.useCallback(() => onOpenNotes(lead), [lead, onOpenNotes]);
  const handleRevert = React.useCallback(() => onRevertTrigger(lead.id), [lead.id, onRevertTrigger]);
  
  const handleStatusChange = React.useCallback((v: string) => {
    onUpdateLead(lead.id, { crm_status: v as Lead['crm_status'] });
  }, [lead.id, onUpdateLead]);

  const handleValueSave = async () => {
    setIsEditingValue(false);
    await onUpdateLead(lead.id, { deal_value: Number(tempValue) || 0 });
  };

  return (
    <React.Fragment>
      <TableRow
        className={`group hover:bg-muted/10 transition-colors duration-200 border-b border-muted/30 ${
          isExpanded ? 'bg-muted/5' : ''
        }`}
      >
        <TableCell className="py-4 pl-4 w-12 text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="h-9 w-9"
            title={isExpanded ? "Hide detailed audit" : "Inspect marketing audit details"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-semibold text-muted-foreground py-4 text-sm">
          {(currentPage - 1) * pageSize + index + 1}
        </TableCell>

        <TableCell className="py-4">
          <div className="flex flex-col gap-1 max-w-sm">
            <span className="font-bold text-foreground text-base leading-snug">{lead.name || 'N/A'}</span>
            {meta.rating !== null && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                <Star className="w-4 h-4 fill-current" />
                <span>{meta.rating}</span>
                <span className="text-muted-foreground font-normal">({meta.reviews || 0} reviews)</span>
              </div>
            )}
            {meta.address && (
              <span className="text-xs text-muted-foreground truncate leading-normal mt-0.5" title={meta.address}>
                {meta.address}
              </span>
            )}
          </div>
        </TableCell>

        <TableCell className="py-4">
          <div className="flex flex-col gap-1.5">
            {lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 text-primary hover:underline hover:text-primary/80 transition-colors font-semibold text-sm"
              >
                <Phone className="w-4 h-4 text-muted-foreground" />
                {lead.phone}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">No Phone</span>
            )}
            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:underline transition-colors font-semibold text-sm truncate max-w-[150px]"
                title={lead.email}
              >
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </a>
            ) : null}
            {lead.website ? (
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition-colors font-semibold text-sm truncate max-w-[150px]"
                title={lead.website}
              >
                <Globe className="w-4 h-4 text-muted-foreground" />
                Website
              </a>
            ) : (
              <Badge variant="secondary" className="text-xs w-fit mt-1">No Website</Badge>
            )}
          </div>
        </TableCell>

        <TableCell className="py-4">
          <div className="space-y-1.5 flex flex-col justify-center">
            <Select 
              value={lead.crm_status || 'no_answer'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="h-10 text-sm font-semibold w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRM_STATUSES.map(st => (
                  <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {checkIsUpdateRequired(lead) && (
              <button
                onClick={handleOpenNotes}
                className="text-[9px] font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded flex items-center justify-center gap-1 w-full transition-colors animate-pulse"
                title="Click to resolve missing mandatory fields"
              >
                <AlertTriangle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                <span>Update Required</span>
              </button>
            )}
          </div>
        </TableCell>

        <TableCell className="py-4">
          {isEditingValue ? (
            <div className="flex items-center gap-1 animate-in fade-in duration-100">
              <span className="text-sm font-bold text-muted-foreground">$</span>
              <input
                type="number"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleValueSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleValueSave();
                }}
                className="w-24 h-9 text-sm font-bold border border-input bg-background rounded-md px-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                autoFocus
              />
            </div>
          ) : (
            <div
              onClick={() => {
                setIsEditingValue(true);
                setTempValue(String(lead.deal_value || 0));
              }}
              className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/40 p-2 rounded border border-transparent hover:border-border/50 w-fit transition-all"
              title="Click to edit deal value"
            >
              <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-extrabold text-foreground">
                ${(lead.deal_value || 0).toLocaleString()}
              </span>
            </div>
          )}
        </TableCell>

        <TableCell className="py-4 text-center">
          <span className={`text-sm ${fu.color}`}>{fu.label}</span>
        </TableCell>

        <TableCell className="py-4 text-center">
          <div className="inline-flex items-center gap-1.5 border border-border/80 p-1.5 rounded-lg bg-muted/20">
            {lead.phone ? (
              <Button variant="outline" size="icon" asChild className="h-9 w-9">
                <a href={outreach.tel} title={`Call client: ${lead.phone}`}>
                  <Phone className="w-4 h-4 text-primary" />
                </a>
              </Button>
            ) : (
              <span className="h-9 w-9 flex items-center justify-center text-muted-foreground/30 text-xs">-</span>
            )}

            {lead.phone ? (
              <Button variant="outline" size="icon" asChild className="h-9 w-9">
                <a href={outreach.wa} target="_blank" rel="noopener noreferrer" title="Open pre-filled WhatsApp audit script">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </a>
              </Button>
            ) : (
              <span className="h-9 w-9 flex items-center justify-center text-muted-foreground/30 text-xs">-</span>
            )}

            <Button variant="outline" size="icon" asChild className="h-9 w-9">
              <a href={outreach.mail} title="Send customizable cold pitch email template">
                <Mail className="w-4 h-4 text-rose-500" />
              </a>
            </Button>
          </div>
        </TableCell>

        <TableCell className="py-4 text-sm">
          {lead.crm_status === 'meeting' ? (
            <div className="space-y-1 flex flex-col justify-start">
              <p className="text-muted-foreground line-clamp-2 leading-relaxed italic font-medium" title={lead.meeting_notes || 'No meeting notes taken yet.'}>
                {lead.meeting_notes || 'No meeting notes taken yet.'}
              </p>
              {lead.meeting_link && (
                <a
                  href={lead.meeting_link.startsWith('http') ? lead.meeting_link : `https://${lead.meeting_link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline mt-1 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded w-fit"
                >
                  <Video className="w-3 h-3" /> Join Meeting
                </a>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground line-clamp-2 leading-relaxed italic font-medium" title={lead.notes || 'No notes taken yet.'}>
              {lead.notes || 'No notes taken yet.'}
            </p>
          )}
        </TableCell>

        <TableCell className="py-4 text-xs font-medium text-muted-foreground leading-normal">
          {lead.created_at ? new Date(lead.created_at).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
          }) : 'N/A'}
        </TableCell>

        <TableCell className="py-4 text-right pr-4 space-x-2 whitespace-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenNotes}
            className="text-xs font-bold h-9 px-3 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
          >
            <Notebook className="w-3.5 h-3.5 mr-1" /> Note History
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRevert}
            className="h-9 w-9 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Move back to prospects"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-muted/5 hover:bg-muted/5 border-b border-muted/30 animate-in fade-in duration-200">
          <TableCell colSpan={11} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <Card>
                  <CardContent className="p-5">
                    <AuditChecklist 
                      lead={lead}
                      reasonText={meta.text} 
                      score={lead.score} 
                      revenueScore={lead.revenue_score}
                      contactScore={lead.contact_score}
                      intentNorm={lead.problems?.intentNorm ?? lead.intent_score ?? 0}
                      digitalGapNorm={lead.problems?.digitalGapNorm ?? lead.digital_gap_score ?? 0}
                    />
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
});

export const CRMLeadsTableDesktop = React.memo(function CRMLeadsTableDesktopComponent({
  leads,
  onUpdateLeadAction,
  onOpenNotesAction,
  currentPage,
  pageSize,
  expandedRowId,
  toggleRow,
  onRevertTrigger
}: CRMLeadsTableDesktopProps) {
  return (
    <div className="w-full overflow-x-auto border-t border-border/60 max-h-[600px] overflow-y-auto scrollbar-thin">
      <Table className="min-w-[1250px] w-full table-fixed">
        <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
          <TableRow className="bg-background hover:bg-background">
            <TableHead className="w-12 pl-4 sticky top-0 bg-background z-20"></TableHead>
            <TableHead className="w-14 font-semibold text-xs uppercase tracking-wider text-muted-foreground sticky top-0 bg-background z-20">S.N.</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[260px] sticky top-0 bg-background z-20">Business Details</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-44 sticky top-0 bg-background z-20">Contact Details</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-40 sticky top-0 bg-background z-20">Pipeline Stage</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-32 sticky top-0 bg-background z-20">Est. Revenue</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-36 text-center sticky top-0 bg-background z-20">Follow Up Date</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-36 text-center sticky top-0 bg-background z-20">Outreach Channels</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[260px] sticky top-0 bg-background z-20">Latest Call Notes</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-36 sticky top-0 bg-background z-20">Acquired At</TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground pr-4 w-40 sticky top-0 bg-background z-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead, index) => (
            <CRMLeadRow
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
        </TableBody>
      </Table>
    </div>
  );
});
