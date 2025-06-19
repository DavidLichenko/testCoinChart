import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { userId: string }
    return decoded.userId
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return null
  }
}

export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}
