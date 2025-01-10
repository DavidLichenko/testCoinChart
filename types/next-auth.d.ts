import NextAuth from "next-auth"

declare module "next-auth" {
    interface User {
        email: string,
        role: string,
    }
    interface Session {
        user: User & {
            email: string,
            role: string,
        }
        token: {
            email: string
        }
    }
}