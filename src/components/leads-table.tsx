import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/lead';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { LeadsTableDesktop } from './leads-table-desktop';
import { LeadsTableMobile } from './leads-table-mobile';

type LeadsTableProps = {
  leads: Lead[];
  onMarkCalled: (id: number, crmStatus?: 'contacted' | 'no_answer') => void;
  isLoading: boolean;
  callingId: number | null;
  currentPage: number;
  pageSize: number;
  totalLeads: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

// Layout Gating Loading Skeleton Fallback to prevent layout shifts during hydration
function TableSkeleton() {
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
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // Hydration-safe viewport checking
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mediaQuery.matches);

    const handleResize = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  const toggleRow = React.useCallback((id: number) => {
    setExpandedRowId(prev => prev === id ? null : id);
  }, []);

  // Pre-mount gating: renders TableSkeleton on the server to protect layout structure & avoid shifts
  if (!mounted || isLoading) {
    return <TableSkeleton />;
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

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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
      
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      {/* Dynamic JS View Selection — Zero Hydration Mismatches */}
      {isDesktop ? (
        <LeadsTableDesktop
          leads={leads}
          onMarkCalled={onMarkCalled}
          callingId={callingId}
          currentPage={currentPage}
          pageSize={pageSize}
          expandedRowId={expandedRowId}
          toggleRow={toggleRow}
        />
      ) : (
        <LeadsTableMobile
          leads={leads}
          onMarkCalled={onMarkCalled}
          callingId={callingId}
          currentPage={currentPage}
          pageSize={pageSize}
          expandedRowId={expandedRowId}
          toggleRow={toggleRow}
        />
      )}

      {/* Pagination Footer */}
      <div className="border-t border-border px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
        <div className="text-xs text-muted-foreground font-medium">
          Showing <span className="font-semibold text-foreground">{Math.min(totalLeads, (currentPage - 1) * pageSize + 1)}</span> to{' '}
          <span className="font-semibold text-foreground">{Math.min(totalLeads, currentPage * pageSize)}</span> of{' '}
          <span className="font-semibold text-foreground">{totalLeads}</span> prospects
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
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
