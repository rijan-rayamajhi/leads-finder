'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile } from '@/types/lead'; // or wherever it is defined
import { Session } from '@supabase/supabase-js';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Ban, 
  Search, 
  Loader2, 
  Award,
  ShieldCheck as ShieldCheckIcon,
  ShieldAlert as ShieldAlertIcon,
  Lock
} from 'lucide-react';

interface AdminPanelProps {
  users: UserProfile[];
  isLoadingUsers: boolean;
  session: Session | null;
  handleUpdateUserStatus: (id: string, status: 'approved' | 'rejected' | 'disabled' | 'blocked') => Promise<void>;
  setConfirmDialogTitle: (t: string) => void;
  setConfirmDialogDesc: (d: string) => void;
  setConfirmDialogAction: (a: () => () => void) => void;
  setConfirmDialogOpen: (o: boolean) => void;
}

function SafeAvatar({ src, name, email, className }: { src: string | null | undefined; name: string | null; email: string | null; className?: string }) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [isError, setIsError] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsError(false);
  }

  const hasAvatar = src && src.trim() !== '' && src !== 'undefined' && src !== 'null' && !isError;

  if (hasAvatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Avatar"
        className={className}
        onError={() => setIsError(true)}
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0 shadow-sm">
      {name?.charAt(0) || email?.charAt(0).toUpperCase() || 'U'}
    </div>
  );
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  isLoadingUsers,
  session,
  handleUpdateUserStatus,
  setConfirmDialogTitle,
  setConfirmDialogDesc,
  setConfirmDialogAction,
  setConfirmDialogOpen
}) => {
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

  return (
    <>
      {/* User management stats card grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300">
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary shrink-0" /> Total Users
            </span>
            <span className="text-2xl font-bold text-foreground tracking-tight block mt-1">{users.length}</span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Approved
            </span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight block mt-1">
              {users.filter(u => u.status === 'approved').length}
            </span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-pulse" /> Pending Approval
            </span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight block mt-1">
              {users.filter(u => u.status === 'pending').length}
            </span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Blocked/Suspended
            </span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight block mt-1">
              {users.filter(u => ['blocked', 'disabled', 'rejected'].includes(u.status)).length}
            </span>
          </CardContent>
        </Card>
      </section>

      {/* User management control card */}
      <Card className="overflow-hidden animate-in fade-in duration-300">
        <CardHeader className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold leading-none flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Registered Member Profiles
            </CardTitle>
            <CardDescription className="text-[11px] mt-1">
              Authorize new administrator requests, manage roles, suspension statuses, and track system registrations.
            </CardDescription>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by email or name..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-9 h-8.5 text-xs"
              />
            </div>
            <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 h-8.5 text-xs">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          {(() => {
            const filteredUsers = users.filter((u) => {
              const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
              const matchesSearch = userSearchQuery.trim() === '' ||
                (u.full_name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase());
              return matchesStatus && matchesSearch;
            });

            if (isLoadingUsers) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">Retrieving user roster database...</p>
                </div>
              );
            }

            if (filteredUsers.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center m-6 border-2 border-dashed border-border rounded-2xl bg-card/40 backdrop-blur-sm animate-in fade-in duration-300">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <Users className="w-5.5 h-5.5 text-primary" />
                  </div>
                  <h3 className="font-extrabold text-base text-foreground tracking-tight">No Users Found</h3>
                  <p className="text-muted-foreground text-xs max-w-sm mt-2 leading-relaxed">
                    No member records matched your active search query or status filter parameters.
                  </p>
                </div>
              );
            }

            return (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    <th className="px-6 py-3.5">User Details</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Current Status</th>
                    <th className="px-6 py-3.5">Joined Date</th>
                    <th className="px-6 py-3.5 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === session?.user?.id;
                    const isPrimaryAdmin = u.email?.toLowerCase() === (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@example.com').toLowerCase();

                    return (
                      <tr key={u.id} className={`hover:bg-muted/20 transition-colors ${isSelf ? 'bg-primary/[0.01]' : ''}`}>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <SafeAvatar
                            src={u.avatar_url}
                            name={u.full_name}
                            email={u.email}
                            className="w-8 h-8 rounded-full border border-border object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                              {u.full_name || 'Active Member'}
                              {isSelf && <Badge variant="outline" className="text-[8px] h-4 px-1 border-primary/30 text-primary bg-primary/5 uppercase font-extrabold tracking-wide">You</Badge>}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.role === 'super_admin' ? (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border-amber-500/20 uppercase tracking-wider flex items-center gap-1 w-fit">
                              <Award className="w-3 h-3 text-amber-500" /> Super Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider w-fit">
                              Standard User
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`text-[10px] font-extrabold uppercase tracking-wider w-fit flex items-center gap-1 ${
                            u.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : u.status === 'pending'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse'
                              : u.status === 'disabled'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : u.status === 'blocked'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            {u.status === 'approved' && <ShieldCheckIcon className="w-3 h-3" />}
                            {u.status === 'pending' && <ShieldAlertIcon className="w-3 h-3" />}
                            {u.status === 'disabled' && <Ban className="w-3 h-3" />}
                            {u.status === 'blocked' && <Lock className="w-3 h-3" />}
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-medium">
                          {new Date(u.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {isPrimaryAdmin ? (
                            <span className="text-[10px] text-muted-foreground/60 font-semibold italic pr-2">System Protected</span>
                          ) : (
                            <>
                              {u.status !== 'approved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setConfirmDialogTitle('Approve Account Access');
                                    setConfirmDialogDesc(`Are you sure you want to approve access for ${u.email}? They will gain immediate entry to the prospects database and pipeline CRM.`);
                                    setConfirmDialogAction(() => () => {
                                      handleUpdateUserStatus(u.id, 'approved');
                                      setConfirmDialogOpen(false);
                                    });
                                    setConfirmDialogOpen(true);
                                  }}
                                  className="text-[10px] font-bold h-7 px-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                >
                                  Approve
                                </Button>
                              )}
                              {u.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setConfirmDialogTitle('Reject Request');
                                    setConfirmDialogDesc(`Are you sure you want to reject the registration request from ${u.email}?`);
                                    setConfirmDialogAction(() => () => {
                                      handleUpdateUserStatus(u.id, 'rejected');
                                      setConfirmDialogOpen(false);
                                    });
                                    setConfirmDialogOpen(true);
                                  }}
                                  className="text-[10px] font-bold h-7 px-2 bg-orange-500/5 hover:bg-orange-500/10 text-orange-600 border-orange-500/20"
                                >
                                  Reject
                                </Button>
                              )}
                              {u.status === 'approved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setConfirmDialogTitle('Suspend User Access');
                                    setConfirmDialogDesc(`Are you sure you want to temporarily disable pipeline access for ${u.email}?`);
                                    setConfirmDialogAction(() => () => {
                                      handleUpdateUserStatus(u.id, 'disabled');
                                      setConfirmDialogOpen(false);
                                    });
                                    setConfirmDialogOpen(true);
                                  }}
                                  className="text-[10px] font-bold h-7 px-2 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 border-amber-500/20"
                                >
                                  Suspend
                                </Button>
                              )}
                              {u.status !== 'blocked' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setConfirmDialogTitle('Block User Account');
                                    setConfirmDialogDesc(`Are you sure you want to permanently block ${u.email}? This action is highly restrictive and logs an administrative ban.`);
                                    setConfirmDialogAction(() => () => {
                                      handleUpdateUserStatus(u.id, 'blocked');
                                      setConfirmDialogOpen(false);
                                    });
                                    setConfirmDialogOpen(true);
                                  }}
                                  className="text-[10px] font-bold h-7 px-2 hover:bg-rose-500/10 hover:text-rose-600"
                                >
                                  Block
                                </Button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      </Card>
    </>
  );
};
