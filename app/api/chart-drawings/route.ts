import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

// GET /api/chart-drawings?symbol=XXX&timeframe=XXX
export async function GET(req: NextRequest) {
  try {
     const userId = await requireAuth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get('symbol')
    const timeframe = searchParams.get('timeframe')

    if (!symbol || !timeframe) {
      return NextResponse.json({ error: 'Symbol and timeframe are required' }, { status: 400 })
    }

    const chartDrawing = await prisma.chartDrawing.findUnique({
      where: {
        userId_symbol_timeframe: {
          userId: userId,
          symbol,
          timeframe,
        },
      },
    })

    return NextResponse.json({
      drawings: chartDrawing ? chartDrawing.drawings : [],
    })
  } catch (error) {
    console.error('Error fetching chart drawings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/chart-drawings
export async function POST(req: NextRequest) {
  try {
     const userId = await requireAuth()
   if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { symbol, timeframe, drawings } = await req.json()

    if (!symbol || !timeframe || !Array.isArray(drawings)) {
      return NextResponse.json({ error: 'Symbol, timeframe, and drawings are required' }, { status: 400 })
    }

    const chartDrawing = await prisma.chartDrawing.upsert({
      where: {
        userId_symbol_timeframe: {
          userId: userId,
          symbol,
          timeframe,
        },
      },
      update: {
        drawings,
        updatedAt: new Date(),
      },
      create: {
        userId: userId,
        symbol,
        timeframe,
        drawings,
      },
    })

    return NextResponse.json({ success: true, chartDrawing })
  } catch (error) {
    console.error('Error saving chart drawings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}