import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { hasAdminAccess } from "@/lib/admin-access"

// PATCH an existing deposit address
export async function PATCH(
  request: NextRequest,
  { params }: { params: { addressId: string } }
) {
  try {
    const basicUser = await getCurrentUser()
    if (!basicUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fullUser = await prisma.user.findUnique({ 
      where: { id: basicUser.id },
      select: { role: true }
    });
    
    if (!fullUser || !hasAdminAccess(fullUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { network, address } = body

    if (!network || !address) {
      return NextResponse.json({ error: "Network and address are required" }, { status: 400 })
    }

    const updatedAddress = await prisma.depositAddress.update({
      where: { id: params.addressId },
      data: { network, address },
    })

    return NextResponse.json(updatedAddress)
  } catch (error) {
    console.error("Error updating deposit address:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE a deposit address
export async function DELETE(
  request: NextRequest,
  { params }: { params: { addressId: string } }
) {
  try {
    const basicUser = await getCurrentUser()
    if (!basicUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fullUser = await prisma.user.findUnique({ 
      where: { id: basicUser.id },
      select: { role: true }
    });
    
    if (!fullUser || !hasAdminAccess(fullUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.depositAddress.delete({
      where: { id: params.addressId },
    })

    return new NextResponse(null, { status: 204 }) // No Content
  } catch (error) {
    console.error("Error deleting deposit address:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}