'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserCheck
} from 'lucide-react';
import { CRMLeadsTableDesktop } from './crm-leads-table-desktop';
import { CRMLeadsTableMobile } from './crm-leads-table-mobile';

type CRMLeadsTableProps = {
  leads: Lead[];
  onUpdateLeadAction: (id: number, fields: Partial<Lead>) => Promise<void>;
  onOpenNotesAction: (lead: Lead) => void;
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalLeads: number;
  onPageChangeAction: (page: number) => void;
  onPageSizeChangeAction: (size: number) => void;
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
              </div>
              <div className="h-9 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Loading Skeleton */}
      <div className="hidden lg:block p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function CRMLeadsTable({
  leads,
  onUpdateLeadAction: onUpdateLead,
  onOpenNotesAction: onOpenNotes,
  isLoading,
  currentPage,
  pageSize,
  totalLeads,
  onPageChangeAction: onPageChange,
  onPageSizeChangeAction: onPageSizeChange
}: CRMLeadsTableProps) {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertLeadId, setRevertLeadId] = useState<number | null>(null);

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

  const handleRevertConfirm = React.useCallback(() => {
    if (revertLeadId !== null) {
      onUpdateLead(revertLeadId, { called: false });
    }
    setRevertDialogOpen(false);
    setRevertLeadId(null);
  }, [revertLeadId, onUpdateLead]);

  const handleRevertTrigger = React.useCallback((id: number) => {
    setRevertLeadId(id);
    setRevertDialogOpen(true);
  }, []);

  // Pre-mount gating: renders TableSkeleton on the server to protect layout structure & avoid shifts
  if (!mounted || isLoading) {
    return <TableSkeleton />;
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

  return (
    <div>
      {/* Dynamic JS View Selection — Zero Hydration Mismatches */}
      {isDesktop ? (
        <CRMLeadsTableDesktop
          leads={leads}
          onUpdateLeadAction={onUpdateLead}
          onOpenNotesAction={onOpenNotes}
          currentPage={currentPage}
          pageSize={pageSize}
          expandedRowId={expandedRowId}
          toggleRow={toggleRow}
          onRevertTrigger={handleRevertTrigger}
        />
      ) : (
        <CRMLeadsTableMobile
          leads={leads}
          onUpdateLeadAction={onUpdateLead}
          onOpenNotesAction={onOpenNotes}
          currentPage={currentPage}
          pageSize={pageSize}
          expandedRowId={expandedRowId}
          toggleRow={toggleRow}
          onRevertTrigger={handleRevertTrigger}
        />
      )}

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
            <Button variant="outline" size="icon" className="h-11 w-11 lg:h-8 lg:w-8 p-0 flex items-center justify-center" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 lg:h-8 lg:w-8 p-0 flex items-center justify-center" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
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
                    className="h-11 min-w-[44px] lg:h-8 lg:min-w-[32px] px-2 text-xs font-bold"
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

            <Button variant="outline" size="icon" className="h-11 w-11 lg:h-8 lg:w-8 p-0 flex items-center justify-center" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 lg:h-8 lg:w-8 p-0 flex items-center justify-center" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
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
