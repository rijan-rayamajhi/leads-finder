'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CRMLeadsTable } from '@/components/crm-leads-table';
import { Lead } from '@/types/lead';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  UserCheck, 
  Search, 
  Filter
} from 'lucide-react';

interface CRMSectionProps {
  pipelineValue: number;
  activeCrmDealsCount: number;
  wonRevenue: number;
  wonDealsCount: number;
  pendingFollowUps: number;
  closeRate: number;
  totalClosedCount: number;
  crmSearchQuery: string;
  setCrmSearchQuery: (q: string) => void;
  crmStatusFilter: string;
  setCrmStatusFilter: (status: string) => void;
  paginatedCrmLeads: Lead[];
  isLoadingCrm: boolean;
  currentPage: number;
  pageSize: number;
  totalCrmLeads: number;
  setCurrentPage: (p: number) => void;
  setPageSize: (s: number) => void;
  handleUpdateCRMLead: (id: number, fields: Partial<Lead>) => Promise<void>;
  handleOpenLeadNotes: (lead: Lead) => void;
}

export const CRMSection: React.FC<CRMSectionProps> = ({
  pipelineValue,
  activeCrmDealsCount,
  wonRevenue,
  wonDealsCount,
  pendingFollowUps,
  closeRate,
  totalClosedCount,
  crmSearchQuery,
  setCrmSearchQuery,
  crmStatusFilter,
  setCrmStatusFilter,
  paginatedCrmLeads,
  isLoadingCrm,
  currentPage,
  pageSize,
  totalCrmLeads,
  setCurrentPage,
  setPageSize,
  handleUpdateCRMLead,
  handleOpenLeadNotes
}) => {
  return (
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
              From {activeCrmDealsCount} active leads
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
              From {wonDealsCount} closed won deals
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
              From {totalClosedCount} closed deals
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
                onChange={(e) => setCrmSearchQuery(e.target.value)}
                className="pl-10 h-10 w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Select value={crmStatusFilter} onValueChange={(v) => { setCrmStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-10 text-xs font-semibold w-full lg:w-48 bg-muted/40 hover:bg-muted/80">
                  <SelectValue placeholder="All Pipeline Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="no_answer">Attempted / No Answer</SelectItem>
                  <SelectItem value="contacted">Spoken to Owner</SelectItem>
                  <SelectItem value="meeting">Meeting Scheduled</SelectItem>
                  <SelectItem value="won">Won Deals</SelectItem>
                  <SelectItem value="lost">Lost / Dead Deals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main CRM Table Workspace */}
      <Card className="overflow-hidden border border-border/60 shadow-sm animate-in fade-in duration-300">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border bg-muted/[0.03]">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            CRM Pipeline Manager
          </CardTitle>
          <CardDescription className="text-[11px] mt-0.5">
            Manage active discussions, schedule pitches, record comments, and finalize won client rebuilds.
          </CardDescription>
        </CardHeader>

        <div className="p-0">
          <CRMLeadsTable
            leads={paginatedCrmLeads}
            onUpdateLeadAction={handleUpdateCRMLead}
            onOpenNotesAction={handleOpenLeadNotes}
            isLoading={isLoadingCrm}
            currentPage={currentPage}
            pageSize={pageSize}
            totalLeads={totalCrmLeads}
            onPageChangeAction={setCurrentPage}
            onPageSizeChangeAction={setPageSize}
          />
        </div>
      </Card>
    </>
  );
};
