import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { pusherServer } from "@/lib/pusher-server"

// Общая проверка админа
async function requireAdmin() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return { error: "Unauthorized" as const, status: 401, user: null }
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { role: true },
  })

  const isAdmin =
      adminUser &&
      (adminUser.role === "OWNER" ||
          adminUser.role === "CR_MANAGMENT" ||
          adminUser.role === "TEAMLEAD")

  if (!isAdmin) {
    return { error: "Forbidden" as const, status: 403, user: null }
  }

  return { error: null, status: 200, user: currentUser }
}

// GET /api/admin/users/[userId] — данные одного юзера для админ-страницы
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const guard = await requireAdmin()
        if (guard.error) {
            return NextResponse.json({ error: guard.error }, { status: guard.status })
        }

        const { userId } = await params
        
        // Get current admin user ID to check favorites
        const currentAdmin = guard.user;
        const currentAdminId = currentAdmin?.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                can_withdraw: true,
                isVerif: true,
                blocked: true,
                baseCurrency: true,
                createdAt: true,
                updatedAt: true,
                assignedTo: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
        
        // Check if user is favorited by current admin
        let isFavorite = false;
        if (currentAdminId) {
            const favorite = await prisma.favoriteClient.findUnique({
                where: {
                    agentId_clientId: {
                        agentId: currentAdminId,
                        clientId: userId
                    }
                }
            });
            isFavorite = !!favorite;
        }

        // Return user with favorite status
        return NextResponse.json({
            ...user,
            isFavorite
        })
    } catch (error) {
        console.error("Error fetching admin user:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// PATCH /api/admin/users/[userId] — обновление юзера
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (guard.error) {
      return NextResponse.json({ error: guard.error }, { status: guard.status })
    }

    const { userId } = await params
    const updates = await request.json()

    // Get current user data first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // какие поля разрешено менять (убрали TotalBalance - используем walletBalances)
    const allowedFields = [
      "name",
      "role",
      "can_withdraw",
      "isVerif",
      "blocked",
      "status",
      "baseCurrency",
    ] as const

    const filteredUpdates: any = {}
    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field]
      }
    }

    // TotalBalance больше не используется - баланс управляется через walletBalances

    // Остальные поля (name, role, status, blocked, isVerif, can_withdraw, baseCurrency)
    if (Object.keys(filteredUpdates).length > 0) {
      // Handle baseCurrency change - convert balance and ensure user has a wallet balance for the new currency
      if ("baseCurrency" in filteredUpdates) {
        const newBaseCurrency = filteredUpdates.baseCurrency;
        const oldBaseCurrency = user.baseCurrency || "USD";
        
        // Get current EUR/USD rate
        let eurUsdRate = 1;
        try {
          const eurUsdRes = await fetch(
            "https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT",
            { cache: "no-store" }
          );
          if (eurUsdRes.ok) {
            const eurUsdData = await eurUsdRes.json();
            eurUsdRate = parseFloat(eurUsdData.price) || 1;
          }
        } catch (error) {
          console.warn("Failed to fetch EUR/USD rate, using fallback:", error);
        }
        
        // Get old base currency balance
        const oldBalance = await prisma.walletBalance.findUnique({
          where: {
            userId_assetSymbol: {
              userId,
              assetSymbol: oldBaseCurrency,
            },
          },
        });
        
        let convertedBalance = 0;
        let convertedCreditLimit = 0;
        let convertedCreditUsed = 0;
        let convertedLocked = 0;
        
        if (oldBalance) {
          // Convert balance based on currency change
          if (oldBaseCurrency === "EUR" && newBaseCurrency === "USD") {
            // EUR to USD: multiply by EUR/USD rate
            convertedBalance = oldBalance.ownBalance * eurUsdRate;
            convertedCreditLimit = oldBalance.creditLimit * eurUsdRate;
            convertedCreditUsed = oldBalance.creditUsed * eurUsdRate;
            convertedLocked = oldBalance.locked * eurUsdRate;
          } else if (oldBaseCurrency === "USD" && newBaseCurrency === "EUR") {
            // USD to EUR: divide by EUR/USD rate
            convertedBalance = oldBalance.ownBalance / eurUsdRate;
            convertedCreditLimit = oldBalance.creditLimit / eurUsdRate;
            convertedCreditUsed = oldBalance.creditUsed / eurUsdRate;
            convertedLocked = oldBalance.locked / eurUsdRate;
          } else {
            // Same currency (shouldn't happen, but just in case)
            convertedBalance = oldBalance.ownBalance;
            convertedCreditLimit = oldBalance.creditLimit;
            convertedCreditUsed = oldBalance.creditUsed;
            convertedLocked = oldBalance.locked;
          }
        }
        
        // Create/update wallet balance for new base currency
        await prisma.walletBalance.upsert({
          where: {
            userId_assetSymbol: {
              userId,
              assetSymbol: newBaseCurrency,
            },
          },
          update: {
            ownBalance: convertedBalance,
            creditLimit: convertedCreditLimit,
            creditUsed: convertedCreditUsed,
            locked: convertedLocked,
          },
          create: {
            userId,
            assetSymbol: newBaseCurrency,
            ownBalance: convertedBalance,
            creditLimit: convertedCreditLimit,
            creditUsed: convertedCreditUsed,
            locked: convertedLocked,
          },
        });
        
        // Optionally: set old balance to 0 or delete it (keeping it for history)
        if (oldBalance && oldBaseCurrency !== newBaseCurrency) {
          await prisma.walletBalance.update({
            where: {
              userId_assetSymbol: {
                userId,
                assetSymbol: oldBaseCurrency,
              },
            },
            data: {
              ownBalance: 0,
              creditLimit: 0,
              creditUsed: 0,
              locked: 0,
            },
          });
        }
      }
      
      // If isVerif is being updated, also update the corresponding verification record
      if ("isVerif" in filteredUpdates) {
        // Update the user's isVerif flag and enable AI Trading if verified
        await prisma.user.update({
          where: { id: userId },
          data: { 
            isVerif: filteredUpdates.isVerif,
            // Automatically enable AI Trading for verified users
            aiTrading: filteredUpdates.isVerif ? true : undefined,
          },
        });

        // Also update or create the verification record to keep them synchronized
        const verificationStatus = filteredUpdates.isVerif ? "APPROVED" : "REJECTED";
        
        // Check if a verification record exists for this user
        const existingVerification = await prisma.verification.findUnique({
          where: { userId: userId },
        });

        if (existingVerification) {
          // Update existing verification record
          await prisma.verification.update({
            where: { userId: userId },
            data: { status: verificationStatus },
          });
        } else if (filteredUpdates.isVerif) {
          // Create a new verification record if user is being verified (not rejected)
          // We'll create a minimal verification record since we don't have document URLs
          await prisma.verification.create({
            data: {
              userId: userId,
              status: verificationStatus,
              frontIdUrl: "",
              backIdUrl: "",
            },
          });
        }

        // Remove isVerif from filteredUpdates so it's not updated again below
        delete filteredUpdates.isVerif;
      }

      // Update remaining fields
      if (Object.keys(filteredUpdates).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: filteredUpdates,
        });
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        TotalBalance: true,
        can_withdraw: true,
        isVerif: true,
        blocked: true,
        baseCurrency: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    )
  }
}
