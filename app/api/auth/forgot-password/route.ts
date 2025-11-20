// app/api/auth/forgot-password/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Чтобы не палить наличие пользователя — можно всегда отвечать "ok"
        if (!user) {
            return NextResponse.json({
                message: "If this email exists, we sent reset instructions.",
            });
        }

        // Удаляем старые токены, если были
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });

        // Генерируем токен
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 час

        await prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expires,
            },
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

        // Отправляем письмо через Resend
        await resend.emails.send({
            from: process.env.RESEND_FROM!,
            to: email,
            subject: "Reset your password",
            // можно сделать нормальный шаблон, пока простой вариант
            html: `
        <p>Hello${user.name ? " " + user.name : ""},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn't request this, just ignore this email.</p>
      `,
        });

        return NextResponse.json({
            message: "If this email exists, we sent reset instructions.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
