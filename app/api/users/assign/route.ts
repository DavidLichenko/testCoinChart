import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/prisma/prisma-client"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userIds, workerId } = await request.json()

    // Verify the worker exists and is actually a worker
    const worker = await prisma.user.findFirst({
      where: {
        id: workerId,
        role: 'WORKER'
      }
    })

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
    }

    // Update all selected users
    await prisma.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: {
        assignedTo: workerId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error assigning users:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

