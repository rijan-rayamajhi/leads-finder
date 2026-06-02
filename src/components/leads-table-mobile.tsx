import React from 'react';
import { Lead } from '@/types/lead';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Globe, 
  Star, 
  MapPin, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown 
} from 'lucide-react';
import { AuditChecklist, parseLeadReason, getTierBadge } from '@/components/audit-checklist';

type LeadsTableMobileProps = {
  leads: Lead[];
  onMarkCalled: (id: number, crmStatus?: 'contacted' | 'no_answer') => void;
  callingId: number | null;
  currentPage: number;
  pageSize: number;
  expandedRowId: number | null;
  toggleRow: (id: number) => void;
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      : score > 50
      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      : 'bg-muted text-muted-foreground border-border';

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {score}
    </Badge>
  );
}

// Memoized mobile card component to optimize render throughput
const LeadMobileCard = React.memo(function LeadMobileCardComponent({
  lead,
  index,
  currentPage,
  pageSize,
  isExpanded,
  toggleRow,
  onMarkCalled,
  callingId
}: {
  lead: Lead;
  index: number;
  currentPage: number;
  pageSize: number;
  isExpanded: boolean;
  toggleRow: (id: number) => void;
  onMarkCalled: (id: number, crmStatus?: 'contacted' | 'no_answer') => void;
  callingId: number | null;
}) {
  const meta = parseLeadReason(lead.reason);
  const handleToggle = React.useCallback(() => toggleRow(lead.id), [lead.id, toggleRow]);
  const handleMarkContacted = React.useCallback(() => onMarkCalled(lead.id, 'contacted'), [lead.id, onMarkCalled]);
  const handleMarkNoAnswer = React.useCallback(() => onMarkCalled(lead.id, 'no_answer'), [lead.id, onMarkCalled]);

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${
        isExpanded ? 'ring-1 ring-primary/20 border-primary/20' : 'border-border'
      }`}
    >
      <div className="absolute top-0 left-0 bg-muted px-2.5 py-0.5 rounded-br-lg text-[9px] font-bold text-muted-foreground border-r border-b border-border flex items-center gap-1.5">
        <span>#{(currentPage - 1) * pageSize + index + 1}</span>
        {lead.created_at && (
          <span className="text-[8px] font-medium text-muted-foreground/80 border-l border-border/60 pl-1.5">
            {new Date(lead.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <CardContent className="p-5 space-y-4 pt-6">
        <div className="flex justify-between items-start gap-2 pt-2">
          <div className="space-y-1 max-w-[70%]">
            <h3 className="font-bold text-base text-foreground leading-tight">
              {lead.name || 'N/A'}
            </h3>
            {meta.rating !== null && (
              <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                <span className="flex items-center"><Star className="w-3 h-3 fill-current mr-0.5" />{meta.rating}</span>
                <span className="text-muted-foreground font-normal">({meta.reviews || 0} reviews)</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <ScoreBadge score={lead.score} />
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

        <div className="space-y-2.5 text-sm pt-2.5 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            {lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                className="text-primary hover:underline font-semibold text-xs"
              >
                {lead.phone}
              </a>
            ) : (
              <span className="text-muted-foreground text-xs">N/A</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            {lead.website ? (
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-xs truncate max-w-[200px]"
              >
                {lead.website}
              </a>
            ) : (
              <span className="text-muted-foreground text-xs">No Website</span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <Badge variant="secondary" className="text-[10px] font-semibold whitespace-nowrap">
              {lead.source || 'Manual'}
            </Badge>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleToggle}
          className="w-full h-11 text-xs font-bold bg-primary/5 hover:bg-primary/10 border-primary/10 text-primary flex items-center justify-between px-4"
        >
          <span>{isExpanded ? 'Hide Detailed Audit' : 'Inspect Audit Report'}</span>
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

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            className="text-xs font-bold h-11 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 shadow-sm"
            onClick={handleMarkContacted}
            disabled={callingId === lead.id}
          >
            {callingId === lead.id ? (
              <span className="animate-spin mr-1">⚡</span>
            ) : (
              <ThumbsUp className="w-4 h-4" />
            )}
            Interested
          </Button>
          <Button
            variant="outline"
            className="text-xs font-bold h-11 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 shadow-sm"
            onClick={handleMarkNoAnswer}
            disabled={callingId === lead.id}
          >
            <ThumbsDown className="w-4 h-4" />
            Not Interested
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export const LeadsTableMobile = React.memo(function LeadsTableMobileComponent({
  leads,
  onMarkCalled,
  callingId,
  currentPage,
  pageSize,
  expandedRowId,
  toggleRow
}: LeadsTableMobileProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {leads.map((lead, index) => (
        <LeadMobileCard
          key={lead.id}
          lead={lead}
          index={index}
          currentPage={currentPage}
          pageSize={pageSize}
          isExpanded={expandedRowId === lead.id}
          toggleRow={toggleRow}
          onMarkCalled={onMarkCalled}
          callingId={callingId}
        />
      ))}
    </div>
  );
});
