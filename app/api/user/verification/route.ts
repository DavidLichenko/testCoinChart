import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const userId = await requireAuth()
    const body = await request.json()
    const { street_address, city, zip_code, front_id_image, back_id_image } = body

    const verification = await prisma.verification.upsert({
      where: { userId },
      update: {
        street_address,
        city,
        zip_code,
        front_id_image,
        back_id_image,
        front_id_verif: front_id_image ? true : undefined,
        back_id_verif: back_id_image ? true : undefined,
      },
      create: {
        userId,
        street_address,
        city,
        zip_code,
        front_id_image,
        back_id_image,
        front_id_verif: front_id_image ? true : false,
        back_id_verif: back_id_image ? true : false,
      },
    })

    return NextResponse.json(verification)
  } catch (error) {
    console.error("Error updating verification:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
