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

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin();
    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }
    
    const currentUser = guard.user;
    const { fromWorkerId, toWorkerId } = await request.json();
    
    // Verify both workers exist
    const fromWorker = await prisma.user.findUnique({
      where: { id: fromWorkerId },
    });
    
    if (!fromWorker) {
      return NextResponse.json({ error: "From worker not found" }, { status: 404 });
    }
    
    const toWorker = await prisma.user.findUnique({
      where: { id: toWorkerId },
      select: { role: true, assignedTo: true }
    });
    
    if (!toWorker) {
      return NextResponse.json({ error: "To worker not found" }, { status: 404 });
    }
    
    // Check permissions
    const currentUserData = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    });
    
    const userRole = currentUserData?.role || "USER";
    
    // TEAMLEADs can only reassign clients between their assigned workers
    if (userRole === "TEAMLEAD") {
      // Both workers must be assigned to this team lead
      if (fromWorker.assignedTo !== currentUser.id || toWorker.assignedTo !== currentUser.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    // Reassign all clients from one worker to another
    // Clients are users with role "USER" assigned to the worker
    const updatedClients = await prisma.user.updateMany({
      where: { 
        assignedAgentTo: fromWorkerId,
        role: "USER"
      },
      data: { assignedAgentTo: toWorkerId },
    });
    
    return NextResponse.json({
      message: `Successfully reassigned ${updatedClients.count} clients`,
      reassignedCount: updatedClients.count
    });
  } catch (error) {
    console.error("Error reassigning clients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}