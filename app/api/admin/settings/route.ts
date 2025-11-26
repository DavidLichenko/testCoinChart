import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { hasAdminAccess } from "@/lib/admin-access"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin using standardized function
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !hasAdminAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get or create settings
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          siteName: "AragonTrade",
          btcAddress: null,
          ethAddress: null,
          usdtAddress: null,
          usdtNetwork: "TRC20"
        }
      })
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin using standardized function
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !hasAdminAccess(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updates = await request.json()

    // Validate updates
    const allowedFields = ['siteName', 'btcAddress', 'ethAddress', 'usdtAddress', 'usdtNetwork']
    const filteredUpdates: any = {}
    
    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field]
      }
    }

    // Get or create settings
    let settings = await prisma.settings.findFirst()
    
    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: filteredUpdates
      })
    } else {
      settings = await prisma.settings.create({
        data: {
          ...filteredUpdates,
          siteName: filteredUpdates.siteName || "AragonTrade",
          usdtNetwork: filteredUpdates.usdtNetwork || "TRC20"
        }
      })
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}