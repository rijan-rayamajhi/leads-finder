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
import { Phone, Check, Search, BadgeInfo, Building } from 'lucide-react';

type LeadsTableProps = {
  leads: Lead[];
  onMarkCalled: (id: number) => void;
  isLoading: boolean;
  callingId: number | null;
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      : score > 50
      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      : 'bg-muted text-muted-foreground border-border';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score}
    </span>
  );
}

export function LeadsTable({ leads, onMarkCalled, isLoading, callingId }: LeadsTableProps) {
  if (isLoading) {
    return (
      <div>
        {/* Mobile Skeleton */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 border rounded-xl bg-card animate-pulse space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-6 bg-muted rounded-full w-12" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
              <div className="h-9 bg-muted rounded w-full" />
            </div>
          ))}
        </div>

        {/* Desktop Skeleton */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell><div className="h-4 bg-muted rounded w-2/3" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-1/2" /></TableCell>
                  <TableCell><div className="h-6 bg-muted rounded-full w-12" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-3/4" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-1/3" /></TableCell>
                  <TableCell className="text-right"><div className="h-8 bg-muted rounded ml-auto w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border rounded-xl bg-card text-center m-4">
        <Building className="w-8 h-8 text-muted-foreground/60 mb-3" />
        <p className="text-muted-foreground text-sm font-medium">
          No leads yet. Run a query to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Card Grid */}
      <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="p-5 border rounded-xl bg-card hover:border-muted-foreground/30 transition-all duration-200 space-y-4 shadow-sm"
          >
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-base text-foreground leading-tight">
                {lead.name || 'N/A'}
              </h3>
              <ScoreBadge score={lead.score} />
            </div>

            <div className="space-y-2.5 text-sm">
              {lead.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-primary hover:underline font-medium transition-colors"
                  >
                    {lead.phone}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>N/A</span>
                </div>
              )}

              <div className="flex items-start gap-2">
                <BadgeInfo className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-xs leading-normal">
                  {lead.reason}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground text-xs font-medium bg-muted px-2 py-0.5 rounded">
                  {lead.source || 'Manual'}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold h-9 flex items-center justify-center gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30 active:bg-primary/10 transition-all"
              onClick={() => onMarkCalled(lead.id)}
              disabled={callingId === lead.id}
            >
              {callingId === lead.id ? (
                <span className="animate-spin mr-1">⚡</span>
              ) : (
                <Check className="w-4 h-4" />
              )}
              Mark Called
            </Button>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Phone</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Score</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Reason</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Source</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="group hover:bg-muted/10 transition-all duration-300 ease-in-out border-b border-muted/30"
              >
                <TableCell className="font-semibold text-foreground py-4">
                  {lead.name || 'N/A'}
                </TableCell>
                <TableCell className="py-4">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 text-primary hover:underline hover:text-primary/80 transition-colors font-medium text-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <ScoreBadge score={lead.score} />
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate py-4" title={lead.reason}>
                  {lead.reason}
                </TableCell>
                <TableCell className="text-muted-foreground font-medium text-xs py-4">
                  {lead.source || 'Manual'}
                </TableCell>
                <TableCell className="text-right py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-90 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary text-xs transition-all"
                    onClick={() => onMarkCalled(lead.id)}
                    disabled={callingId === lead.id}
                  >
                    {callingId === lead.id ? (
                      <span className="animate-spin mr-1">⚡</span>
                    ) : (
                      <Check className="w-3.5 h-3.5 mr-1" />
                    )}
                    Mark Called
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

