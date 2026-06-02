import React from 'react';
import { Lead } from '@/types/lead';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

type LeadsTableDesktopProps = {
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

// Memoized individual desktop row component to optimize DOM performance
const LeadRow = React.memo(function LeadRowComponent({
  lead,
  index,
  currentPage,
  pageSize,
  isExpanded,
  toggleRow,
  onMarkCalled,
  callingId,
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
    <React.Fragment>
      <TableRow
        className={`group hover:bg-muted/10 transition-all duration-300 ease-in-out border-b border-muted/30 ${
          isExpanded ? 'bg-muted/5' : ''
        }`}
      >
        <TableCell className="py-4 pl-4 w-12 text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="h-9 w-9 text-muted-foreground hover:text-foreground transition-all"
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
                <span className="flex items-center"><Star className="w-3.5 h-3.5 fill-current mr-0.5" />{meta.rating}</span>
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
            {lead.website ? (
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition-colors font-semibold text-sm max-w-[150px] truncate"
                title={lead.website}
              >
                <Globe className="w-4 h-4 text-muted-foreground" />
                Website
              </a>
            ) : (
              <Badge variant="secondary" className="text-xs w-fit mt-1">No Web</Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="py-4 text-center">
          {meta.maps_url ? (
            <a
              href={meta.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card hover:bg-muted text-primary hover:text-primary/80 transition-all shadow-sm mx-auto"
              title="Open Google Maps Profile"
            >
              <MapPin className="w-4 h-4 text-rose-500 fill-rose-500/10" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="py-4">
          <div className="flex flex-col gap-1.5 w-fit">
            <ScoreBadge score={lead.score} />
            {(() => {
              const badge = getTierBadge(lead.tier ?? lead.problems?.tier);
              return (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border text-center whitespace-nowrap ${badge.color}`}>
                  {badge.label}
                </span>
              );
            })()}
          </div>
        </TableCell>
        <TableCell className="py-4 text-sm">
          <p className="text-muted-foreground line-clamp-2 leading-relaxed font-semibold" title={meta.text}>
            {meta.text}
          </p>
        </TableCell>
        <TableCell className="py-4">
          <Badge variant="secondary" className="text-xs font-semibold max-w-[140px] truncate block" title={lead.source || 'Manual'}>
            {lead.source || 'Manual'}
          </Badge>
        </TableCell>
        <TableCell className="py-4 text-xs font-medium text-muted-foreground leading-normal">
          {lead.created_at ? new Date(lead.created_at).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
          }) : 'N/A'}
        </TableCell>
        <TableCell className="text-right py-4 pr-4">
          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all duration-200"
              onClick={handleMarkContacted}
              disabled={callingId === lead.id}
              title="Interested (Move to CRM)"
            >
              {callingId === lead.id ? (
                <span className="animate-spin text-sm">⚡</span>
              ) : (
                <ThumbsUp className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all duration-200"
              onClick={handleMarkNoAnswer}
              disabled={callingId === lead.id}
              title="Not Interested (Mark Attempted / No Answer)"
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-muted/5 hover:bg-muted/5 border-b border-muted/30 animate-in fade-in duration-200">
          <TableCell colSpan={10} className="p-6">
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

export const LeadsTableDesktop = React.memo(function LeadsTableDesktopComponent({
  leads,
  onMarkCalled,
  callingId,
  currentPage,
  pageSize,
  expandedRowId,
  toggleRow
}: LeadsTableDesktopProps) {
  return (
    <div className="w-full overflow-x-auto border-t border-border/60 max-h-[600px] overflow-y-auto scrollbar-thin">
      <Table className="min-w-[1300px] w-full table-fixed">
        <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
          <TableRow className="bg-background hover:bg-background">
            <TableHead className="w-12 pl-4 sticky top-0 bg-background z-20"></TableHead>
            <TableHead className="w-14 font-semibold text-xs uppercase tracking-wider text-muted-foreground sticky top-0 bg-background z-20">S.N.</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[240px] sticky top-0 bg-background z-20">Business Details</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-44 sticky top-0 bg-background z-20">Contact Details</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center w-24 sticky top-0 bg-background z-20">Maps Profile</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-24 sticky top-0 bg-background z-20">Score</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[240px] sticky top-0 bg-background z-20">Audit Reason</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-40 sticky top-0 bg-background z-20">Source</TableHead>
            <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-40 sticky top-0 bg-background z-20">Acquired At</TableHead>
            <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground pr-4 w-32 sticky top-0 bg-background z-20">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead, index) => (
            <LeadRow
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
        </TableBody>
      </Table>
    </div>
  );
});
