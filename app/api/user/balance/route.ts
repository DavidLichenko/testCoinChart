// app/api/user/balance/route.ts
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";
import {getUserBalanceData} from "@/lib/user-balance";

export async function GET() {
  try {
    const userId = await requireAuth();
    const data = await getUserBalanceData(userId);

    return NextResponse.json({
      userId,
      balance: data.balance,      // totalEquity
      liveProfit: data.liveProfit,
      details: data.details,
    });
  } catch (error: any) {
    console.error("Error in /api/user/balance:", error);

    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error?.message === "User not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
  }
}
