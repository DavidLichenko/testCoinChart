import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!adminUser || (adminUser.role !== 'OWNER' && adminUser.role !== 'CR_MANAGMENT' && adminUser.role !== 'TEAMLEAD')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { orderId } = params
    const { status } = await request.json()

    // Validate status
    if (!['PENDING', 'SUCCESSFUL', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { status },
      include: {
        User: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updatedOrder)

  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 