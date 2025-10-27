import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { UserRole } from "@prisma/client"

// GET all deposit addresses
export async function GET(request: NextRequest) {
  try {

    const addresses = await prisma.depositAddress.findMany()
    return NextResponse.json(addresses)
  } catch (error) {
    console.error("Error fetching deposit addresses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST a new deposit address
export async function POST(request: NextRequest) {
  let network: string | undefined;
  try {
    const basicUser = await getCurrentUser()
    if (!basicUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: basicUser.id },
    })

    if (!user || (user.role !== UserRole.OWNER && user.role !== UserRole.CR_MANAGMENT && user.role !== UserRole.TEAMLEAD)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const address = body.address as string;
    network = body.network as string;

    if (!network || !address) {
      return NextResponse.json({ error: "Network and address are required" }, { status: 400 })
    }

    const newAddress = await prisma.depositAddress.create({
      data: {
        network,
        address,
      },
    })

    return NextResponse.json(newAddress)
  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes('network')) {
        return NextResponse.json({ error: `A deposit address for the '${network}' network already exists.` }, { status: 409 });
      }
      if (target?.includes('address')) {
        return NextResponse.json({ error: 'This address is already in use.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'A unique constraint violation occurred.' }, { status: 409 });
    }
    
    console.error("Error creating deposit address:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 