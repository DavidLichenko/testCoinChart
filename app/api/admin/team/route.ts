import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Общая проверка админа
async function requireAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: "Unauthorized" as const, status: 401, user: null };
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true },
  });

  const isAdmin =
    adminUser &&
    (adminUser.role === "OWNER" ||
      adminUser.role === "CR_MANAGMENT" ||
      adminUser.role === "TEAMLEAD");

  if (!isAdmin) {
    return { error: "Forbidden" as const, status: 403, user: null };
  }

  return { error: null, status: 200, user: currentUser };
}

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }
    
    const currentUser = guard.user;
    
    // Fetch all users with walletBalances
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedTo: true,
        assignedAgentTo: true,
        status: true,
        createdAt: true,
        baseCurrency: true,
        walletBalances: {
          select: {
            assetSymbol: true,
            ownBalance: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Calculate balance from walletBalances for each user
    const usersWithBalance = users.map(user => {
      const baseCurrency = user.baseCurrency || "USD"
      const wallet = user.walletBalances.find(w => w.assetSymbol === baseCurrency)
      return {
        ...user,
        TotalBalance: wallet?.ownBalance || 0
      }
    });
    
    // Get current user's role
    const currentUserData = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    });
    
    const userRole = currentUserData?.role || "USER";
    
    // Calculate team statistics
    const teamLeads = users.filter(user => user.role === "TEAMLEAD");
    const workers = users.filter(user => user.role === "WORKER");
    const clients = users.filter(user => user.role === "USER");
    
    // For TEAMLEAD users, only show their assigned users
    let filteredUsers = usersWithBalance;
    if (userRole === "TEAMLEAD") {
      filteredUsers = usersWithBalance.filter(
        user => user.id === currentUser.id || user.assignedTo === currentUser.id
      );
    }
    
    // Calculate team stats
    const totalDeposits = usersWithBalance.reduce((sum, user) => {
      return sum + (user.TotalBalance || 0);
    }, 0);
    
    const activeUsers = usersWithBalance.filter(user => user.status !== "TRASH").length;
    
    // Calculate team lead performance
    const teamLeadPerformance = teamLeads.map(lead => {
      const leadWorkers = usersWithBalance.filter(user => user.assignedTo === lead.id);
      const leadClients = usersWithBalance.filter(user => user.assignedTo === lead.id);
      const leadDeposits = leadWorkers.reduce((sum, worker) => {
        return sum + (worker.TotalBalance || 0);
      }, 0);
      
      // Simple performance calculation based on deposits and number of clients
      const performance = Math.min(100, Math.round((leadDeposits / 1000) + (leadClients.length * 2)));
      
      return {
        id: lead.id,
        name: lead.name,
        workers: leadWorkers.length,
        clients: leadClients.length,
        deposits: leadDeposits,
        performance,
      };
    });
    
    return NextResponse.json({
      users: filteredUsers,
      stats: {
        totalTeamLeads: teamLeads.length,
        totalWorkers: workers.length,
        totalClients: clients.length,
        totalDeposits,
        activeUsers,
      },
      teamLeadPerformance,
    });
  } catch (error) {
    console.error("Error fetching team data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}