import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@auth/core/jwt";


export async function middleware(request:NextRequest) {
    const token = await getToken({
        req:request,
        secret:process.env.NEXTAUTH_SECRET,
    })
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next()
}

export const config = {
    matcher: ["/admin/:path*"]
}