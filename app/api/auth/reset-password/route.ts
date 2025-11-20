// app/api/auth/reset-password/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: "Token and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken || !resetToken.user) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 400 }
            );
        }

        if (resetToken.expires < new Date()) {
            // Токен протух
            await prisma.passwordResetToken.delete({
                where: { token },
            });

            return NextResponse.json(
                { error: "Token has expired" },
                { status: 400 }
            );
        }

        const hashed = await hashPassword(password);

        // Обновляем пароль юзера
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: {
                password: hashed,
            },
        });

        // Удаляем токен (одноразовый)
        await prisma.passwordResetToken.delete({
            where: { token },
        });

        return NextResponse.json({ message: "Password has been reset" });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
