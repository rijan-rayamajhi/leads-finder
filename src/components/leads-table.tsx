import React, { useState } from 'react';
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
  Check, 
  Search, 
  BadgeInfo, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Globe,
  Star,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

type LeadsTableProps = {
  leads: Lead[];
  onMarkCalled: (id: number) => void;
  isLoading: boolean;
  callingId: number | null;
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

function AuditChecklist({ reasonText, score }: { reasonText: string; score: number }) {
  const normalized = reasonText.toLowerCase();
  
  // 1. Website Status check
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

  // 2. Contact Form check
  const hasNoContactForm = normalized.includes('no contact form');
  
  // 3. Email check
  const hasNoEmail = normalized.includes('no email');
  
  // 4. Content check
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
        {/* Web Presence Card */}
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

        {/* Contact Form Card */}
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

        {/* Email Capture Card */}
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

        {/* Content Quality Card */}
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

export function LeadsTable({ 
  leads, 
  onMarkCalled, 
  isLoading, 
  callingId,
  currentPage,
  pageSize,
  totalLeads,
  onPageChange,
  onPageSizeChange
}: LeadsTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const toggleRow = (id: number) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  if (isLoading) {
    return (
      <div>
        {/* Mobile & Tablet Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4 p-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 animate-pulse space-y-4">
              <CardContent className="p-0 space-y-4">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Skeleton */}
        <div className="hidden lg:block">
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

  if (totalLeads === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center m-6 border-2 border-dashed border-border rounded-2xl bg-card/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-sm animate-pulse">
          <Search className="w-5.5 h-5.5 text-primary" />
        </div>
        <h3 className="font-extrabold text-base text-foreground tracking-tight">No Prospects Scraped Yet</h3>
        <p className="text-muted-foreground text-xs max-w-sm mt-2 leading-relaxed">
          Get started by typing a niche and location (e.g., <span className="font-bold text-foreground">&quot;salons in mumbai&quot;</span> or <span className="font-bold text-foreground">&quot;dentists in pune&quot;</span>) in the search bar above, then click <span className="font-bold text-primary">Scrape</span>.
        </p>
        <div className="flex items-center gap-2 mt-5 text-[10px] text-muted-foreground font-semibold bg-muted/60 border border-border px-3 py-1 rounded-full">
          <span>⚡ Real-time Places Auditing active</span>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalLeads / pageSize) || 1;

  // Generate an array of page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      {/* Mobile & Tablet Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4 p-4">
        {leads.map((lead, index) => {
          const meta = parseLeadReason(lead.reason);
          const isExpanded = expandedRowId === lead.id;
          return (
            <Card
              key={lead.id}
              className={`relative overflow-hidden transition-all duration-200 ${
                isExpanded ? 'ring-1 ring-primary/20 border-primary/20' : 'border-border'
              }`}
            >
              {/* Mobile Card Serial Number Tag */}
              <div className="absolute top-0 left-0 bg-muted px-2.5 py-0.5 rounded-br-lg text-[9px] font-bold text-muted-foreground border-r border-b border-border">
                #{(currentPage - 1) * pageSize + index + 1}
              </div>

              <CardContent className="p-5 space-y-4 pt-6">
                {/* Header: Title, rating, and score */}
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
                  <ScoreBadge score={lead.score} />
                </div>

                <div className="space-y-2.5 text-sm pt-2.5 border-t border-border/50">
                  {/* Phone */}
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

                  {/* Website */}
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

                  {/* Source badge */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Badge variant="secondary" className="text-[10px] font-semibold whitespace-nowrap">
                      {lead.source || 'Manual'}
                    </Badge>
                  </div>
                </div>

                 {/* View Audit Report Action toggle */}
                <Button
                  variant="outline"
                  onClick={() => toggleRow(lead.id)}
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
                    <AuditChecklist reasonText={meta.text} score={lead.score} />

                    {/* Physical Address */}
                    {meta.address && (
                      <div className="flex items-start gap-2 bg-muted/40 p-3 rounded-lg border border-border/50 text-xs">
                        <MapPin className="w-4 h-4 text-rose-500 fill-rose-500/10 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-normal">
                          <strong>Address:</strong> {meta.address}
                        </span>
                      </div>
                    )}

                    {/* Google Maps Profile link */}
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

                <Button
                  variant="default"
                  size="sm"
                  className="w-full text-xs font-bold h-11 flex items-center justify-center gap-1.5 shadow-sm transition-all animate-none"
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4"></TableHead>
              <TableHead className="w-14 font-semibold text-xs uppercase tracking-wider text-muted-foreground">S.N.</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Business Details</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Contact Details</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center w-28">Maps Profile</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground w-28">Score</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground max-w-[200px]">Audit Reason</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Source</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground pr-4">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead, index) => {
              const meta = parseLeadReason(lead.reason);
              const isExpanded = expandedRowId === lead.id;
              return (
                <React.Fragment key={lead.id}>
                  <TableRow
                    className={`group hover:bg-muted/10 transition-all duration-300 ease-in-out border-b border-muted/30 ${
                      isExpanded ? 'bg-muted/5' : ''
                    }`}
                  >
                    <TableCell className="py-4 pl-4 w-10 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRow(lead.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground transition-all"
                        title={isExpanded ? "Hide detailed audit" : "Inspect marketing audit details"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-primary" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-semibold text-muted-foreground py-4 text-xs">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-0.5 max-w-sm">
                        <span className="font-bold text-foreground text-sm leading-snug">{lead.name || 'N/A'}</span>
                        {/* Rating and Reviews */}
                        {meta.rating !== null && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-bold mt-0.5">
                            <span className="flex items-center"><Star className="w-3 h-3 fill-current mr-0.5" />{meta.rating}</span>
                            <span className="text-muted-foreground font-normal">({meta.reviews || 0} reviews)</span>
                          </div>
                        )}
                        {/* Physical Address */}
                        {meta.address && (
                          <span className="text-[11px] text-muted-foreground truncate leading-normal mt-0.5" title={meta.address}>
                            {meta.address}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1.5">
                        {/* Phone */}
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="inline-flex items-center gap-1.5 text-primary hover:underline hover:text-primary/80 transition-colors font-semibold text-xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">No Phone</span>
                        )}
                        {/* Website */}
                        {lead.website ? (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition-colors font-semibold text-xs max-w-[150px] truncate"
                            title={lead.website}
                          >
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            Website
                          </a>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] w-fit mt-1">No Web</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      {meta.maps_url ? (
                        <a
                          href={meta.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-card hover:bg-muted text-primary hover:text-primary/80 transition-all shadow-sm mx-auto"
                          title="Open Google Maps Profile"
                        >
                          <MapPin className="w-4 h-4 text-rose-500 fill-rose-500/10" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <ScoreBadge score={lead.score} />
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate py-4 text-xs font-medium" title={meta.text}>
                      {meta.text}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className="text-[10px] font-semibold whitespace-nowrap">
                        {lead.source || 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-4 pr-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] font-bold h-7 px-2.5 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-200"
                        onClick={() => onMarkCalled(lead.id)}
                        disabled={callingId === lead.id}
                      >
                        {callingId === lead.id ? (
                          <span className="animate-spin mr-1">⚡</span>
                        ) : (
                          <Check className="w-3 h-3 mr-1" />
                        )}
                        Mark Called
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

      {/* Pagination Footer */}
      <div className="border-t border-border px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
        {/* Left: Stats information */}
        <div className="text-xs text-muted-foreground font-medium">
          Showing <span className="font-semibold text-foreground">{Math.min(totalLeads, (currentPage - 1) * pageSize + 1)}</span> to{' '}
          <span className="font-semibold text-foreground">{Math.min(totalLeads, currentPage * pageSize)}</span> of{' '}
          <span className="font-semibold text-foreground">{totalLeads}</span> prospects
        </div>

        {/* Center/Right: Page navigation and Page Size Selector */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Rows per page:</span>
            <div className="flex items-center gap-1 bg-muted/40 border border-border p-0.5 rounded-lg">
              {[10, 25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => onPageSizeChange(size)}
                  className={`px-3 py-2 lg:px-2.5 lg:py-1 text-[11px] font-bold rounded-md transition-all ${
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

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 lg:h-8 lg:w-8 p-0 flex items-center justify-center"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 lg:h-8 lg:w-8 p-0 flex items-center justify-center"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Numbers for Desktop */}
            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers().map((p, idx) => (
                typeof p === 'number' ? (
                  <Button
                    key={idx}
                    variant={currentPage === p ? "default" : "outline"}
                    className="h-11 min-w-[44px] lg:h-8 lg:min-w-[32px] px-2 text-xs font-bold"
                    onClick={() => onPageChange(p)}
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

            {/* Compact Indicator for Mobile */}
            <span className="sm:hidden text-xs font-semibold text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 lg:h-8 lg:w-8 p-0 flex items-center justify-center"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 lg:h-8 lg:w-8 p-0 flex items-center justify-center"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
