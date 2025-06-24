import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getCurrentUser } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { updateBalance } from "@/app/actions/updateBalance"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || (user.role !== 'OWNER' && user.role !== 'CR_MANAGMENT' && user.role !== 'TEAMLEAD')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

 const orders = await prisma.orders.findMany({
  orderBy: { createdAt: "desc" },
  include: {
    User: true, // <-- this includes ALL user fields for each order
  }
});

    return NextResponse.json(orders)

  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getCurrentUser()
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminDetails = await prisma.user.findUnique({ where: { id: adminUser.id } })
    if (!adminDetails || (adminDetails.role !== UserRole.OWNER && adminDetails.role !== UserRole.CR_MANAGMENT)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId, type, amount, status } = await req.json()

    if (!userId || !type || !amount || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 })
    }

    const newOrder = await prisma.orders.create({
      data: {
        userId,
        type,
        amount: parseFloat(amount),
        status,
      },
    })

    // If a successful deposit is created, update the user's balance
    if (type === "DEPOSIT" && status === "SUCCESSFUL") {
      const currentBalance = targetUser.TotalBalance || 0
      const newBalance = currentBalance + parseFloat(amount)
      await updateBalance(userId, newBalance)
    }

    return NextResponse.json(newOrder, { status: 201 })

  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 