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
    const { userId, assignToId } = await request.json();
    
    // Verify both users exist
    const userToAssign = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!userToAssign) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const assignToUser = await prisma.user.findUnique({
      where: { id: assignToId },
    });
    
    if (!assignToUser) {
      return NextResponse.json({ error: "Assign to user not found" }, { status: 404 });
    }
    
    // Check permissions
    const currentUserData = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { role: true }
    });
    
    const userRole = currentUserData?.role || "USER";
    
    // TEAMLEADs can only assign users to themselves or reassign their assigned users
    if (userRole === "TEAMLEAD") {
      // Check if the user being assigned is already assigned to this team lead
      // or if we're assigning someone to this team lead
      const isAllowed = 
        (userToAssign.assignedTo === currentUser.id && assignToUser.id === currentUser.id) ||
        (userToAssign.id === currentUser.id && assignToUser.role === "TEAMLEAD");
      
      if (!isAllowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    // Perform the assignment
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { assignedTo: assignToId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedTo: true,
        TotalBalance: true,
        status: true,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error assigning user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}