"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  BarChart, 
  BarChart2, 
  Users, 
  MoreHorizontal, 
  User, 
  UserCheck,
  UserX,
  UserPlus
} from "lucide-react";
import { toast } from "@/components/toast"
import { hasAdminAccess } from "@/lib/admin-access"

interface User {
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

export default function TeamManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalTeamLeads: 0,
    totalWorkers: 0,
    totalClients: 0,
    totalDeposits: 0,
    activeUsers: 0
  });
  const [teamLeadPerformance, setTeamLeadPerformance] = useState<TeamLeadPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  
  // Add access control check
  useEffect(() => {
    // Since this component is only rendered within the admin panel, we assume the user has admin access
    // In a real implementation, you might want to verify this with an API call or context
  }, [])
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/team");
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
        setTeamStats(data.stats);
        setTeamLeadPerformance(data.teamLeadPerformance);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch team data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch team data",
        variant: "destructive"
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, assignToId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "User assigned successfully"
        });
        fetchUsers(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to assign user",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error assigning user:", error);
      toast({
        title: "Error",
        description: "Failed to assign user",
        variant: "destructive"
      });
    }
  };

  const handleReassignClients = async (fromWorkerId: string, toWorkerId: string) => {
    try {
      const response = await fetch("/api/admin/team/reassign-clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fromWorkerId, toWorkerId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Clients reassigned successfully"
        });
        fetchUsers(); // Refresh data
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reassign clients",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error reassigning clients:", error);
      toast({
        title: "Error",
        description: "Failed to reassign clients",
        variant: "destructive"
      });
    }
  };

  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Owner</Badge>;
      case "CR_MANAGMENT":
        return <Badge className="bg-blue-500 hover:bg-blue-600">CR Management</Badge>;
      case "TEAMLEAD":
        return <Badge className="bg-green-500 hover:bg-green-600">Team Lead</Badge>;
      case "USER":
        return <Badge className="bg-gray-500 hover:bg-gray-600">User</Badge>;
      case "WORKER":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Worker</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{role}</Badge>;
    }
  };

  if (accessDenied) {
    return <div>Access Denied</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Team Leads</p>
                <p className="text-2xl font-bold">{teamStats.totalTeamLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Workers</p>
                <p className="text-2xl font-bold">{teamStats.totalWorkers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Clients</p>
                <p className="text-2xl font-bold">{teamStats.totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Deposits</p>
                <p className="text-2xl font-bold">${teamStats.totalDeposits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart2 className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold">{teamStats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Lead Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Lead Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Lead</TableHead>
                <TableHead>Workers</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Deposits</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamLeadPerformance.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name || "Unnamed Lead"}</TableCell>
                  <TableCell>{lead.workers}</TableCell>
                  <TableCell>{lead.clients}</TableCell>
                  <TableCell>${lead.deposits.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${lead.performance}%` }}
                        ></div>
                      </div>
                      <span>{lead.performance}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || "Unnamed User"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getUserRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.assignedTo 
                      ? users.find(u => u.id === user.assignedTo)?.name || user.assignedTo 
                      : "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ${user.TotalBalance?.toLocaleString() || "0.00"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Assign User</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserX className="mr-2 h-4 w-4" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign User Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Assign <span className="font-bold">{selectedUser?.name || selectedUser?.email}</span> to:
            </p>
            <div className="space-y-2">
              <Select
                onValueChange={(value) => {
                  if (selectedUser) {
                    handleAssignUser(selectedUser.id, value);
                    setIsAssignDialogOpen(false);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team lead" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => u.role === "TEAMLEAD")
                    .map((teamLead) => (
                      <SelectItem key={teamLead.id} value={teamLead.id}>
                        {teamLead.name || teamLead.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}