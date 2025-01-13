'use server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/prisma/prisma-client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const UserCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().nullable(),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'ADMIN', 'WORKER', 'USER']),
})

const UserUpdateSchema = z.object({
  email: z.string().email('Invalid email address'),
  number: z.string().optional(),
  name: z.string().nullable(),
  role: z.enum(['OWNER', 'ADMIN', 'WORKER', 'USER']),
  status: z.enum(['WRONGNUMBER', 'WRONGINFO', 'CALLBACK', 'LOWPOTENTIAL', 'HIGHPOTENTIAL', 'NOTINTERESTED', 'DEPOSIT', 'TRASH', 'DROP', 'NEW', 'RESIGN', 'COMPLETED']),
  can_withdraw: z.boolean(),
  blocked: z.boolean(),
  isVerif: z.boolean(),
  deposit_message: z.string().nullable(),
  withdraw_error: z.string().nullable(),
  balance: z.number().nullable(),
})

export async function getUsers() {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  // If the user is a worker, only show assigned users
  if (session.user.role === 'WORKER') {
    return await prisma.user.findMany({
      where: {
        assignedTo: session.user.id
      },
      include: {
        balance: true
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // For admin and other roles, show all users
  return await prisma.user.findMany({
    include: {
      balance: true
    },
    orderBy: { createdAt: 'desc' },
  })
}


export async function createUser(data: z.infer<typeof UserCreateSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new Error('Unauthorized: Please sign in to create users')
    }

    // Validate input
    const validatedData = UserCreateSchema.parse(data)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      throw new Error('A user with this email already exists')
    }

    // Create user with initial balance
    const newUser = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: validatedData.password, // Note: In production, hash the password
          name: validatedData.name,
          number: validatedData.phone,
          role: validatedData.role,
          status: 'NEW',
        },
      })

      // Create initial balance record
      await tx.balances.create({
        data: {
          userId: user.id,
          usd: 0,
        },
      })

      // Return user with balance
      return await tx.user.findUnique({
        where: { id: user.id },
        include: { balance: true }
      })
    })

    revalidatePath('/admin/users')
    return { success: true, data: newUser }
  } catch (error) {
    console.error('Error creating user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    }
  }
}

export async function updateUser(userId: string, data: z.infer<typeof UserUpdateSchema>) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new Error('Unauthorized: Please sign in to update users')
    }

    // Validate input
    const validatedData = UserUpdateSchema.parse(data)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    // Update user and balance in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          email: validatedData.email,
          number: validatedData.number,
          name: validatedData.name,
          role: validatedData.role,
          status: validatedData.status,
          can_withdraw: validatedData.can_withdraw,
          blocked: validatedData.blocked,
          isVerif: validatedData.isVerif,
          deposit_message: validatedData.deposit_message,
          withdraw_error: validatedData.withdraw_error,
        },
      })

      // Update balance if provided
      if (validatedData.balance !== null) {
        await tx.balances.upsert({
          where: { userId },
          create: {
            userId,
            usd: validatedData.balance
          },
          update: {
            usd: validatedData.balance
          }
        })
      }

      // Return updated user with balance
      return await tx.user.findUnique({
        where: { id: userId },
        include: { balance: true }
      })
    })

    revalidatePath('/admin/users')
    return { success: true, data: updatedUser }
  } catch (error) {
    console.error('Error updating user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user'
    }
  }
}

export async function updateUserBalance(userId: string, balance: number) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new Error('Unauthorized: Please sign in to update balance')
    }

    if (balance < 0) {
      throw new Error('Balance cannot be negative')
    }

    const updatedBalance = await prisma.balances.upsert({
      where: { userId },
      create: {
        userId,
        usd: balance
      },
      update: {
        usd: balance
      }
    })

    revalidatePath('/admin/users')
    return { success: true, data: updatedBalance }
  } catch (error) {
    console.error('Error updating balance:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update balance'
    }
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new Error('Unauthorized: Please sign in to delete users')
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    // Delete user and related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.balances.deleteMany({ where: { userId } })
      await tx.message.deleteMany({ where: { userId } })
      await tx.verification.deleteMany({ where: { userId } })
      await tx.comments.deleteMany({ where: { userId } })
      await tx.trade_Transaction.deleteMany({ where: { userId } })
      await tx.orders.deleteMany({ where: { userId } })

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user'
    }
  }
}

export async function updateBulkUsers(ids: string[], data: { role?: string, status?: string }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new Error('Unauthorized: Please sign in to perform bulk updates')
    }

    if (!ids.length) {
      throw new Error('No users selected for update')
    }

    await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: {
        ...(data.role && { role: data.role }),
        ...(data.status && { status: data.status })
      }
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    console.error('Error updating users:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update users'
    }
  }
}

