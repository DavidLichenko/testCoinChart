import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
    const sessionToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const pathname = req.nextUrl.pathname;

    // Allow static files and Next.js internals to pass through
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.match(/\.(.*)$/)
    ) {
        return NextResponse.next();
    }

    // Allow public pages without session
    const publicPaths = ["/welcome", "/sign-in", "/sign-up"];
    if (!sessionToken && publicPaths.includes(pathname)) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users
    if (!sessionToken) {
        return NextResponse.redirect(new URL("/welcome", req.url));
    }

    // Extract role from session token
    const userRole = sessionToken.role;

    // Restrict access to /admin for non-ADMIN users
    if (pathname.startsWith("/admin") && userRole === "USER") {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/funds", "/history", "/admin_panel", "/admin", "/trade"], // Include necessary routes
};
