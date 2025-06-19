import type { NextAuthConfig } from "next-auth"
import Google from "@auth/core/providers/google";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";

const prisma = new PrismaClient()

export default {
    adapter:PrismaAdapter(prisma),
    providers: [
        Google
    ],
    session:{
        strategy:"jwt",
        maxAge: 30 * 24 * 60 * 60
    },
    pages:{
        signIn: "/login",
        signOut: "logout",
    }
} satisfies NextAuthConfig