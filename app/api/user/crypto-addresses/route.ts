import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

// GET user crypto addresses
export async function GET() {
  try {
    const userId = await requireAuth()

    const addresses = await prisma.userCryptoAddress.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        asset: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error("Error fetching user crypto addresses:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create new crypto address
export async function POST(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { assetSymbol, network, address, label } = body

    if (!assetSymbol || !network || !address) {
      return NextResponse.json(
        { error: "Missing required fields: assetSymbol, network, address" },
        { status: 400 }
      )
    }

    // Validate asset exists
    const asset = await prisma.asset.findUnique({
      where: { symbol: assetSymbol },
    })

    if (!asset) {
      return NextResponse.json(
        { error: "Invalid asset symbol" },
        { status: 400 }
      )
    }

    const cryptoAddress = await prisma.userCryptoAddress.create({
      data: {
        userId,
        assetSymbol,
        network,
        address,
        label: label || null,
        isActive: true,
      },
      include: {
        asset: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(cryptoAddress)
  } catch (error) {
    console.error("Error creating crypto address:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE crypto address
export async function DELETE(request: Request) {
  try {
    const userId = await requireAuth()
    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get("id")

    if (!addressId) {
      return NextResponse.json(
        { error: "Missing address ID" },
        { status: 400 }
      )
    }

    // Verify ownership
    const address = await prisma.userCryptoAddress.findUnique({
      where: { id: addressId },
    })

    if (!address || address.userId !== userId) {
      return NextResponse.json(
        { error: "Address not found or unauthorized" },
        { status: 404 }
      )
    }

    await prisma.userCryptoAddress.update({
      where: { id: addressId },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting crypto address:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

