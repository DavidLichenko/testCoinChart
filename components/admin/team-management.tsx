"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

import { useAuth } from "@/components/auth-provider";
import { hasAdminAccess } from "@/lib/admin-access";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  BarChart2,
  Users,
  MoreHorizontal,
  User,
  UserCheck,
  UserX,
  UserPlus,
  Shuffle,
} from "lucide-react";
import { toast } from "@/components/toast";

interface UserType {
  id: string;
  name: string | null;
  email: string;
  role: string;
  assignedTo: string | null;
  assignedAgentTo: string | null;
  TotalBalance: number | null;
  status: string;
  createdAt: string;
}

interface TeamStats {
  totalTeamLeads: number;
  totalWorkers: number;
  totalClients: number;
  totalDeposits: number;
  activeUsers: number;
}

interface TeamLeadPerformance {
  id: string;
  name: string | null;
  workers: number;
  clients: number;
  deposits: number;
  performance: number;
}

const USERS_PER_PAGE = 10;

const ROLE_ORDER: Record<string, number> = {
  OWNER: 1,
  CR_MANAGMENT: 2,
  TEAMLEAD: 3,
  WORKER: 4,
  USER: 5,
};

type SortBy = "role" | "name" | "created_desc" | "created_asc";

export default function TeamManagement() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserType[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalTeamLeads: 0,
    totalWorkers: 0,
    totalClients: 0,
    totalDeposits: 0,
    activeUsers: 0,
  });
  const [teamLeadPerformance, setTeamLeadPerformance] = useState<
      TeamLeadPerformance[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // filters / sorting / pagination
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("role");
  const [currentPage, setCurrentPage] = useState(1);

  // фильтр по конкретному TeamLead для таблицы
  const [teamLeadFilter, setTeamLeadFilter] = useState<string | null>(null);

  // reassign clients dialog
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [fromWorkerId, setFromWorkerId] = useState<string>("");
  const [toWorkerId, setToWorkerId] = useState<string>("");
  const [reassignLoading, setReassignLoading] = useState(false);

  // ---- access control ----
  useEffect(() => {
    if (!currentUser) return;
    if (!hasAdminAccess(currentUser)) {
      setAccessDenied(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (accessDenied) return;
    fetchUsers();
  }, [accessDenied]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/team", { cache: "no-store" });
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setTeamStats(data.stats);
        setTeamLeadPerformance(data.teamLeadPerformance);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch team data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (userId: string, assignToId: string) => {
    try {
      const response = await fetch("/api/admin/team/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, assignToId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "User assigned successfully",
        });
        fetchUsers(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to assign user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error assigning user:", error);
      toast({
        title: "Error",
        description: "Failed to assign user",
        variant: "destructive",
      });
    }
  };

  const handleReassignClients = async (
      fromWorkerId: string,
      toWorkerId: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/admin/team/reassign-clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromWorkerId, toWorkerId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Clients reassigned successfully",
        });
        await fetchUsers(); // Refresh data
        return true;
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reassign clients",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error reassigning clients:", error);
      toast({
        title: "Error",
        description: "Failed to reassign clients",
        variant: "destructive",
      });
      return false;
    }
  };

  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
            <Badge className="rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/40">
              Owner
            </Badge>
        );
      case "CR_MANAGMENT":
        return (
            <Badge className="rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/40">
              CR Management
            </Badge>
        );
      case "TEAMLEAD":
        return (
            <Badge className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/40">
              Team Lead
            </Badge>
        );
      case "WORKER":
        return (
            <Badge className="rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/40">
              Worker
            </Badge>
        );
      case "USER":
        return (
            <Badge className="rounded-full bg-muted text-muted-foreground border border-border/60">
              User
            </Badge>
        );
      default:
        return (
            <Badge className="rounded-full bg-muted text-muted-foreground border border-border/60">
              {role}
            </Badge>
        );
    }
  };

  // ---------- DERIVED: filtered + sorted + paginated users ----------

  const filteredAndSortedUsers = useMemo(() => {
    let list = [...users];

    if (roleFilter !== "all") {
      list = list.filter(u => u.role === roleFilter);
    }

    if (teamLeadFilter) {
      list = list.filter(
          u =>
              u.id === teamLeadFilter ||
              u.assignedTo === teamLeadFilter ||
              u.assignedAgentTo === teamLeadFilter,
      );
    }

    list.sort((a, b) => {
      if (sortBy === "role") {
        const ra = ROLE_ORDER[a.role] ?? 999;
        const rb = ROLE_ORDER[b.role] ?? 999;
        if (ra !== rb) return ra - rb;
        return (a.name || a.email).localeCompare(b.name || b.email);
      }

      if (sortBy === "name") {
        return (a.name || a.email).localeCompare(b.name || b.email);
      }

      if (sortBy === "created_desc") {
        return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      if (sortBy === "created_asc") {
        return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      return 0;
    });

    return list;
  }, [users, roleFilter, sortBy, teamLeadFilter]);

  const totalPages = Math.max(
      1,
      Math.ceil(filteredAndSortedUsers.length / USERS_PER_PAGE),
  );

  const visibleUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredAndSortedUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredAndSortedUsers, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const workers = users.filter(u => u.role === "WORKER");

  const currentTeamLeadName =
      teamLeadFilter &&
      teamLeadPerformance.find(t => t.id === teamLeadFilter)?.name;

  // ---------- RENDER ----------

  if (accessDenied) {
    return (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive-foreground">
          Access denied. You don&apos;t have permission to view this page.
        </div>
    );
  }

  if (loading) {
    return (
        <div className="space-y-4">
          <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="p-4 space-y-2">
                    <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-2/3 rounded-full bg-muted animate-pulse" />
                    <div className="h-5 w-1/2 rounded-full bg-muted animate-pulse" />
                  </CardContent>
                </Card>
            ))}
          </div>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="h-4 w-32 rounded bg-muted animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 rounded bg-muted animate-pulse" />
              ))}
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
              <h2 className="text-lg font-semibold sm:text-xl text-foreground">
                Team & Hierarchy
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Overview of team leads, workers and client assignments.
            </p>
          </div>

          <Badge className="h-8 rounded-full border border-border bg-background px-3 text-[11px] font-normal text-muted-foreground">
            {users.length} total users
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Team Leads
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {teamStats.totalTeamLeads}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-emerald-500" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Workers
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {teamStats.totalWorkers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-amber-500" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Clients
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {teamStats.totalClients}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <BarChart className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Deposits
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ${teamStats.totalDeposits.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <BarChart2 className="h-8 w-8 text-rose-500" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Active Users
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {teamStats.activeUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TeamLead summary cards + View team */}
        {teamLeadPerformance.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamLeadPerformance.map(lead => (
                  <Card
                      key={lead.id}
                      className="border-border bg-card/95 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Team Lead</p>
                          <p className="text-sm font-semibold text-foreground">
                            {lead.name || "Unnamed Lead"}
                          </p>
                        </div>
                        <Badge className="rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/40 text-[10px]">
                          {lead.performance}% perf
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide">
                            Workers
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {lead.workers}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide">
                            Clients
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {lead.clients}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide">
                            Deposits
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            ${lead.deposits.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${lead.performance}%` }}
                          />
                        </div>

                        <Button
                            size="sm"
                            variant={
                              teamLeadFilter === lead.id ? "default" : "outline"
                            }
                            className="h-7 px-3 rounded-lg text-[11px]"
                            onClick={() => {
                              if (teamLeadFilter === lead.id) {
                                setTeamLeadFilter(null);
                              } else {
                                setTeamLeadFilter(lead.id);
                              }
                              setCurrentPage(1);
                            }}
                        >
                          View team
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
        )}

        {/* Team Lead Performance table */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              Team Lead Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/60 bg-muted/40">
                  <TableHead className="text-xs text-muted-foreground">
                    Team Lead
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Workers
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Clients
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Deposits
                  </TableHead>
                  <TableHead className="text-xs text-muted-foreground">
                    Performance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamLeadPerformance.map(lead => (
                    <TableRow
                        key={lead.id}
                        className="border-b border-border/40 hover:bg-muted/40"
                    >
                      <TableCell className="text-xs font-medium text-foreground">
                        {lead.name || "Unnamed Lead"}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {lead.workers}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {lead.clients}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        ${lead.deposits.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-24 bg-muted rounded-full h-2 mr-2 overflow-hidden">
                            <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${lead.performance}%` }}
                            />
                          </div>
                          <span className="text-xs text-foreground">
                        {lead.performance}%
                      </span>
                        </div>
                      </TableCell>
                    </TableRow>
                ))}

                {teamLeadPerformance.length === 0 && (
                    <TableRow>
                      <TableCell
                          colSpan={5}
                          className="py-4 text-center text-xs text-muted-foreground"
                      >
                        No performance data yet.
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Filters + Reassign button */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="w-full sm:w-48">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                  Filter by role
                </p>
                <Select
                    value={roleFilter}
                    onValueChange={val => {
                      setRoleFilter(val);
                      setCurrentPage(1);
                    }}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl border border-input bg-background text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card text-xs">
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="CR_MANAGMENT">CR management</SelectItem>
                    <SelectItem value="TEAMLEAD">Team lead</SelectItem>
                    <SelectItem value="WORKER">Worker</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-52">
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                  Sort by
                </p>
                <Select
                    value={sortBy}
                    onValueChange={val => {
                      setSortBy(val as SortBy);
                      setCurrentPage(1);
                    }}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl border border-input bg-background text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card text-xs">
                    <SelectItem value="role">Role group</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="created_desc">
                      Newest first (created)
                    </SelectItem>
                    <SelectItem value="created_asc">
                      Oldest first (created)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {teamLeadFilter && (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-[11px] text-muted-foreground">
                <span className="truncate">
                  Team filter:{" "}
                  <span className="font-semibold text-foreground">
                    {currentTeamLeadName || teamLeadFilter}
                  </span>
                </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => {
                          setTeamLeadFilter(null);
                          setCurrentPage(1);
                        }}
                    >
                      <UserX className="h-3 w-3" />
                    </Button>
                  </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-[11px] text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                {visibleUsers.length}
              </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                {filteredAndSortedUsers.length}
              </span>{" "}
                filtered users
              </div>

              {/* Reassign clients dialog trigger */}
              <Dialog
                  open={isReassignDialogOpen}
                  onOpenChange={open => {
                    setIsReassignDialogOpen(open);
                    if (!open) {
                      setFromWorkerId("");
                      setToWorkerId("");
                      setReassignLoading(false);
                    }
                  }}
              >
                <DialogTrigger asChild>
                  <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg border-border bg-background text-[11px]"
                  >
                    <Shuffle className="mr-1.5 h-3.5 w-3.5" />
                    Reassign clients
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[92vw] max-w-md border border-border bg-card">
                  <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <DialogHeader className="flex flex-row items-start justify-between gap-2">
                      <div>
                        <DialogTitle className="text-sm font-semibold text-foreground">
                          Reassign clients between workers
                        </DialogTitle>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Move all clients from one worker to another.
                        </p>
                      </div>
                      <DialogClose asChild>
                        <button className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <UserX className="h-4 w-4" />
                        </button>
                      </DialogClose>
                    </DialogHeader>

                    <div className="mt-3 space-y-3 text-xs text-foreground">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-foreground">
                          From worker
                        </label>
                        <Select
                            value={fromWorkerId}
                            onValueChange={val => setFromWorkerId(val)}
                        >
                          <SelectTrigger className="h-9 w-full rounded-lg border border-input bg-background text-xs">
                            <SelectValue placeholder="Select source worker" />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-card text-xs">
                            {workers.map(w => (
                                <SelectItem key={w.id} value={w.id}>
                                  {w.name || w.email}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-foreground">
                          To worker
                        </label>
                        <Select
                            value={toWorkerId}
                            onValueChange={val => setToWorkerId(val)}
                        >
                          <SelectTrigger className="h-9 w-full rounded-lg border border-input bg-background text-xs">
                            <SelectValue placeholder="Select destination worker" />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-card text-xs">
                            {workers
                                .filter(w => w.id !== fromWorkerId)
                                .map(w => (
                                    <SelectItem key={w.id} value={w.id}>
                                      {w.name || w.email}
                                    </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        All clients currently handled by the{" "}
                        <span className="font-semibold">From worker</span> will be
                        moved to the <span className="font-semibold">To worker</span>.
                      </p>

                      <div className="mt-2 flex justify-end gap-2">
                        <DialogClose asChild>
                          <Button
                              variant="outline"
                              className="h-8 rounded-lg border-border bg-background px-3 text-[11px]"
                              disabled={reassignLoading}
                          >
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                            className="h-8 rounded-lg bg-primary px-4 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                            disabled={
                                reassignLoading ||
                                !fromWorkerId ||
                                !toWorkerId ||
                                fromWorkerId === toWorkerId
                            }
                            onClick={async () => {
                              if (
                                  !fromWorkerId ||
                                  !toWorkerId ||
                                  fromWorkerId === toWorkerId
                              )
                                return;
                              setReassignLoading(true);
                              const ok = await handleReassignClients(
                                  fromWorkerId,
                                  toWorkerId,
                              );
                              setReassignLoading(false);
                              if (ok) {
                                setIsReassignDialogOpen(false);
                                setFromWorkerId("");
                                setToWorkerId("");
                              }
                            }}
                        >
                          {reassignLoading && (
                              <span className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border border-primary-foreground border-b-transparent" />
                          )}
                          Reassign clients
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-border bg-card shadow-md">
          <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-y border-border bg-muted/60">
                    <TableHead className="text-xs text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Email
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Role
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Assigned To
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Balance
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleUsers.map(user => {
                    const assigned =
                        user.assignedTo &&
                        users.find(u => u.id === user.assignedTo);
                    return (
                        <TableRow
                            key={user.id}
                            className="border-b border-border/40 hover:bg-muted/50"
                        >
                          <TableCell className="text-xs font-medium text-foreground">
                            {user.name || "Unnamed User"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell className="text-xs">
                            {getUserRoleBadge(user.role)}
                          </TableCell>
                          <TableCell className="text-xs text-foreground">
                            {assigned
                                ? assigned.name || assigned.email
                                : "Unassigned"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge
                                variant={
                                  user.status === "ACTIVE" ? "default" : "secondary"
                                }
                                className="rounded-full px-2 text-[10px]"
                            >
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-foreground">
                            ${user.TotalBalance?.toLocaleString() || "0.00"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-muted"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                  align="end"
                                  className="border-border bg-card text-xs"
                              >
                                <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsAssignDialogOpen(true);
                                    }}
                                    className="text-xs"
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  <span>Assign to team lead</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs">
                                  <UserX className="mr-2 h-4 w-4" />
                                  <span>View details</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                    );
                  })}

                  {visibleUsers.length === 0 && (
                      <TableRow>
                        <TableCell
                            colSpan={7}
                            className="py-4 text-center text-xs text-muted-foreground"
                        >
                          No users with current filters.
                        </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px]">
                  <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg border-border bg-background px-2 text-[11px]"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                  >
                    Prev
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                          p =>
                              p === 1 ||
                              p === totalPages ||
                              (p >= currentPage - 1 && p <= currentPage + 1),
                      )
                      .map((p, idx, arr) => (
                          <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-0.5 text-muted-foreground">…</span>
                    )}
                            <Button
                                size="icon"
                                variant={p === currentPage ? "default" : "outline"}
                                className={`h-7 w-7 rounded-lg text-[11px] ${
                                    p === currentPage
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "border-border bg-background text-foreground hover:bg-muted"
                                }`}
                                onClick={() => handlePageChange(p)}
                            >
                      {p}
                    </Button>
                  </span>
                      ))}
                  <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg border-border bg-background px-2 text-[11px]"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Assign User Dialog (с motion внутри) */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="w-[92vw] max-w-md border border-border bg-card">
            <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <DialogHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <DialogTitle className="text-sm font-semibold text-foreground">
                    Assign user to team lead
                  </DialogTitle>
                  {selectedUser && (
                      <p className="mt-1 text-[11px] text-muted-foreground truncate">
                        {selectedUser.name || selectedUser.email}
                      </p>
                  )}
                </div>
                <DialogClose asChild>
                  <button className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <UserX className="h-4 w-4" />
                  </button>
                </DialogClose>
              </DialogHeader>

              <div className="mt-3 space-y-4 text-xs text-foreground">
                <p className="text-[11px] text-muted-foreground">
                  Choose a{" "}
                  <span className="font-medium text-foreground">TEAMLEAD</span> who
                  will be responsible for this user.
                </p>

                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-foreground">
                    Team lead
                  </label>
                  <Select
                      onValueChange={value => {
                        if (selectedUser) {
                          handleAssignUser(selectedUser.id, value);
                          setIsAssignDialogOpen(false);
                        }
                      }}
                  >
                    <SelectTrigger className="h-9 w-full rounded-lg border border-input bg-background text-xs">
                      <SelectValue placeholder="Select team lead" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card text-xs">
                      {users
                          .filter(u => u.role === "TEAMLEAD")
                          .map(teamLead => (
                              <SelectItem key={teamLead.id} value={teamLead.id}>
                                {teamLead.name || teamLead.email}
                              </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button
                        variant="outline"
                        className="h-8 rounded-lg border-border bg-background px-3 text-[11px]"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
