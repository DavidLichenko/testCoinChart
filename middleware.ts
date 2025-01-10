import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    // FOR DEPLOY __Secure-next-auth.session-token
    const session = req.cookies.get('__Secure-next-auth.session-token'); // Adjust based on your session cookie key
    const pathname = req.nextUrl.pathname;

    // Allow static files and Next.js internals to pass through
    if (
        pathname.startsWith('/_next') || // Next.js internals
        pathname.startsWith('/static') || // Static files
        pathname.startsWith('/favicon.ico') || // Favicon
        pathname.match(/\.(.*)$/) // File extensions like .css, .js, .png, etc.
    ) {
        return NextResponse.next();
    }

    // Allow public pages without session
    const publicPaths = ['/welcome', '/sign-in', '/sign-up'];
    if (!session && publicPaths.includes(pathname)) {
        return NextResponse.next();
    }

    // Redirect unauthenticated users trying to access protected routes
    if (!session) {
        return NextResponse.redirect(new URL('/welcome', req.url));
    }

    // Allow authenticated users
    return NextResponse.next();
}

// Apply middleware only to specific routes
export const config = {
    matcher: ['/funds','/history', '/admin_panel', '/admin', '/trade'], // Include all necessary routes
};
