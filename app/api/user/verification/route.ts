// app/api/user/verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

const UPLOAD_API =
    process.env.UPLOAD_API_URL ||
    "https://b7e852d78a9f.ngrok-free.app/api/upload/verification";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await request.formData();
        const frontIdFile = formData.get("frontId") as File | null;
        const backIdFile = formData.get("backId") as File | null;
        const address = formData.get("address") as string | null;
        const city = formData.get("city") as string | null;
        const postalCode = formData.get("postalCode") as string | null;

        if (!frontIdFile || !backIdFile) {
            return NextResponse.json(
                { error: "Both front and back ID images are required." },
                { status: 400 }
            );
        }

        if (!address || !city || !postalCode) {
            return NextResponse.json(
                { error: "Address, city, and postal code are required." },
                { status: 400 }
            );
        }

        // 1) Upload files to VPS FastAPI
        const uploadFd = new FormData();
        uploadFd.append("frontId", frontIdFile);
        uploadFd.append("backId", backIdFile);

        const uploadRes = await fetch(UPLOAD_API, {
            method: "POST",
            body: uploadFd,
        });

        if (!uploadRes.ok) {
            const errText = await uploadRes.text().catch(() => "");
            return NextResponse.json(
                { error: `Upload server error: ${uploadRes.status}. ${errText}` },
                { status: 500 }
            );
        }

        const { frontIdUrl, backIdUrl } = (await uploadRes.json()) as {
            frontIdUrl: string;
            backIdUrl: string;
        };

        if (!frontIdUrl || !backIdUrl) {
            return NextResponse.json(
                { error: "Upload server did not return URLs." },
                { status: 500 }
            );
        }

        // 2) Save URLs to DB
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const verification = await tx.verification.upsert({
                where: { userId: user.id },
                update: {
                    frontIdUrl,
                    backIdUrl,
                    address,
                    city,
                    postalCode,
                    status: "PENDING",
                },
                create: {
                    userId: user.id,
                    frontIdUrl,
                    backIdUrl,
                    address,
                    city,
                    postalCode,
                    status: "PENDING",
                },
            });

            await tx.user.update({
                where: { id: user.id },
                data: { isVerif: false },
            });

            return verification;
        });

        return NextResponse.json({
            message: "Verification documents submitted successfully.",
            verification: result,
        });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
