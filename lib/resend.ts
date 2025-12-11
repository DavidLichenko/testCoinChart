// lib/resend.ts
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    // Лучше явная ошибка, чем непонятное поведение
    throw new Error("RESEND_API_KEY is not set in environment variables");
}

export const resend = new Resend(apiKey);