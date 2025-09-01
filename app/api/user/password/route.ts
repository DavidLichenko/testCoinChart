import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
	try {
		const userId = await requireAuth()
		const { currentPassword, newPassword } = await request.json()

		if (!newPassword || newPassword.length < 8) {
			return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
		}

		const user = await prisma.user.findUnique({ where: { id: userId } })
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 })
		}

		if (user.password) {
			if (!currentPassword) {
				return NextResponse.json({ error: "Current password is required" }, { status: 400 })
			}
			const valid = await bcrypt.compare(currentPassword, user.password)
			if (!valid) {
				return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
			}
		}

		const hashed = await bcrypt.hash(newPassword, 10)
		await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error changing password:", error)
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
} 