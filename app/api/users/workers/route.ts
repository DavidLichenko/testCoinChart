import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/prisma/prisma-client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workers = await prisma.user.findMany({
      where: {
        role: 'WORKER'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return NextResponse.json(workers)
  } catch (error) {
    console.error('Error fetching workers:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

