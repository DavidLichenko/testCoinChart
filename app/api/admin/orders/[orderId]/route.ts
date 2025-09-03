import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher-server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    const { orderId } = params;
    const { status } = await request.json();

    // Validate status
    if (!["PENDING", "SUCCESSFUL", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Fetch the order including user and amount
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { User: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If order is already SUCCESSFUL or CANCELLED, prevent double processing
    if (order.status === "SUCCESSFUL" || order.status === "CANCELLED") {
      return NextResponse.json({ error: "Order already processed" }, { status: 400 });
    }

    // Update order status
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { status },
      include: { User: true },
    });

    // If status is SUCCESSFUL, add funds to user balance
    if (status === "SUCCESSFUL") {
      await prisma.$transaction(async (tx) => {
        const newBalance = (order.User.TotalBalance || 0) + order.amount;

        // Update user's TotalBalance
        await tx.user.update({
          where: { id: order.userId },
          data: { TotalBalance: newBalance },
        });

        // Update or create Balances record
        await tx.balances.upsert({
          where: { userId: order.userId },
          update: { usd: newBalance },
          create: { userId: order.userId, usd: newBalance },
        });

        // Send real-time update via Pusher
        await pusherServer.trigger(`user-${order.userId}`, "balance-update", {
          totalBalance: newBalance,
        });
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
