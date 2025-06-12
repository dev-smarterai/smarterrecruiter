import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

// Define constants for paths
const PUBLIC_PATHS = ['/login', '/api/analyze-cv', '/api/validate-pdf', '/register', '/api/openai-format', '/yc', '/a16z', '/orb.webm'];
const ADMIN_PATHS = ['/overview', '/jobs', '/candidates', '/agencies', '/avatar', '/settings', '/details', '/home', '/dashboard'];
const USER_PATHS = ['/application-form', '/job-interview', '/ai-chatbot', '/ai-meeting'];
const ONBOARDING_PATHS = ['/onboarding']; 

export async function middleware(request: NextRequest) {
    // Create a Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    const { pathname } = request.nextUrl;
    console.log(`[Middleware] Processing request for path: ${pathname}`);
    
    // Special handling for requests from YC or A16Z page
    const referer = request.headers.get('referer');
    const isFromYCPage = referer && referer.includes('/yc');
    const isFromA16ZPage = referer && referer.includes('/a16z');
    const isFromDemoPage = isFromYCPage || isFromA16ZPage;
    
    // If the request is for an API and is coming from a demo page, allow it through
    if (isFromDemoPage && pathname.startsWith('/api/')) {
        console.log(`[Middleware] Allowing API request from demo page: ${pathname}`);
        return NextResponse.next();
    }
    
    // Check if user is authenticated by trying to fetch the current user
    let userData = null;
    let isAuthenticated = false;
    
    try {
        // Get stored user data from cookie (if available)
        const userDataCookie = request.cookies.get('user')?.value;
        userData = userDataCookie ? JSON.parse(userDataCookie) : null;
        console.log(`[Middleware] User data from cookie:`, userData);
        
        // Get the session token from cookies
        const sessionToken = request.cookies.get('session')?.value;
        console.log(`[Middleware] Session token exists: ${!!sessionToken}`);
        
        if (sessionToken) {
            // Verify session is valid with Convex
            console.log(`[Middleware] Validating session with Convex...`);
            const sessionValid = await convex.query(api.users.validateSession, { 
                sessionToken 
            });
            
            isAuthenticated = sessionValid;
            console.log(`[Middleware] Session valid: ${sessionValid}`);
            
            if (!sessionValid && userData) {
                // Session is invalid but we have user cookie - clear it
                console.log(`[Middleware] Invalid session but user cookie exists - clearing cookies`);
                userData = null;
                const response = NextResponse.redirect(new URL('/login', request.url));
                response.cookies.delete('user');
                response.cookies.delete('session');
                return response;
            }
        }
    } catch (error) {
        console.error('[Middleware] Auth validation error:', error);
        isAuthenticated = false;
    }

    // Requests to non-public paths require authentication
    if (!isAuthenticated && !PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        console.log(`[Middleware] Unauthenticated access to protected path - redirecting to login`);
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If user is logged in and trying to access login page, redirect based on role
    if (isAuthenticated && pathname === '/login' && userData) {
        console.log(`[Middleware] Authenticated user accessing login page - redirecting based on role`);
        const url = request.nextUrl.clone();
        if (userData.role === 'admin') {
            // If admin hasn't completed onboarding, send them there
            if (!userData.completedOnboarding) {
                console.log(`[Middleware] Admin hasn't completed onboarding - redirecting to onboarding`);
                url.pathname = '/onboarding/products';
            } else {
                url.pathname = '/home';
            }
        } else {
            // Regular users always go to application form (skip onboarding)
            console.log(`[Middleware] Regular user - redirecting to application form`);
            url.pathname = '/application-form';
        }
        return NextResponse.redirect(url);
    }

    // Role-based access control
    if (isAuthenticated && userData) {
        // Regular users should not access admin paths
        if (userData.role === 'user' && ADMIN_PATHS.some(path => pathname.startsWith(path))) {
            console.log(`[Middleware] Regular user accessing admin path - redirecting to application form`);
            const url = request.nextUrl.clone();
            url.pathname = '/application-form';
            return NextResponse.redirect(url);
        }

        // Only admin users can access onboarding
        if (userData.role === 'user' && ONBOARDING_PATHS.some(path => pathname.startsWith(path))) {
            console.log(`[Middleware] Regular user accessing onboarding - redirecting to application form`);
            const url = request.nextUrl.clone();
            url.pathname = '/application-form';
            return NextResponse.redirect(url);
        }

        // If admin has completed onboarding but tries to access it again, redirect to dashboard
        if (userData.role === 'admin' && userData.completedOnboarding &&
            ONBOARDING_PATHS.some(path => pathname.startsWith(path))) {
            console.log(`[Middleware] Admin with completed onboarding accessing onboarding - redirecting to dashboard`);
            const url = request.nextUrl.clone();
            url.pathname = '/home';
            return NextResponse.redirect(url);
        }
    }

    console.log(`[Middleware] Proceeding with request`);
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 