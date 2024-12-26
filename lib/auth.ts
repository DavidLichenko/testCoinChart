import NextAuth, {NextAuthOptions} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {PrismaAdapter} from "@next-auth/prisma-adapter";
import {prisma} from "@/prisma/prisma-client";
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy:'jwt'
    },
    pages: {
        signIn:'/sign-in',
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "jonh@mail.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }
                const  exitingUser = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                })
                if (!exitingUser) {
                    return null
                }
                const passwordMatch = await credentials.password === exitingUser.password

                if (!passwordMatch) {
                    return null
                }

                return {
                    id: exitingUser.id.toString(),
                    email: exitingUser.email
                }



            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if(user) {
                return {
                    ...token,
                    id:user.id,
                    email: user.email,
                }
            }

            return token
        },
        async session({ session, user, token }) {
            return {
                ...session,
                user:{
                    ...session.user,
                    id: token.id,
                    email: token.email,
                }
            }
        }
    }
}