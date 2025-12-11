import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hasOwnerAccess } from "@/lib/admin-access"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !hasOwnerAccess(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get settings (there should be only one)
    const settings = await prisma.settings.findFirst()
    
    return NextResponse.json({
      minSeconds: settings?.aiAnalysisMinSeconds ?? 5,
      maxSeconds: settings?.aiAnalysisMaxSeconds ?? 10,
    })
  } catch (error) {
    console.error("Error fetching AI analysis settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !hasOwnerAccess(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { minSeconds, maxSeconds } = body

    if (minSeconds < 1 || maxSeconds < 1 || minSeconds > maxSeconds) {
      return NextResponse.json(
        { error: "Invalid time range" },
        { status: 400 }
      )
    }

    // Get or create settings
    let settings = await prisma.settings.findFirst()
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          aiAnalysisMinSeconds: minSeconds,
          aiAnalysisMaxSeconds: maxSeconds,
        },
      })
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          aiAnalysisMinSeconds: minSeconds,
          aiAnalysisMaxSeconds: maxSeconds,
        },
      })
    }

    return NextResponse.json({
      minSeconds: settings.aiAnalysisMinSeconds ?? 5,
      maxSeconds: settings.aiAnalysisMaxSeconds ?? 10,
    })
  } catch (error) {
    console.error("Error updating AI analysis settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


