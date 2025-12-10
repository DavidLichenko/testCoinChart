import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const assetSymbol = searchParams.get("assetSymbol") || undefined;

    const settings = await prisma.settings.findFirst();
    if (!settings) return NextResponse.json([]);

    const payoutAddresses = await prisma.payoutAddress.findMany({
        where: {
            settingsId: settings.id,
            isActive: true,
            // assetSymbol может быть null → общий адрес
            ...(assetSymbol
                ? {
                    OR: [{ assetSymbol }, { assetSymbol: null }]
                }
                : {})
        },
        orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(payoutAddresses);
}
