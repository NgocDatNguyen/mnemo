import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Route protection rules:
 *
 * - /(app)/*    → require session; redirect to /auth/login if absent
 * - /(auth)/*   → if session exists, redirect to /dashboard (no point logging in twice)
 * - /waitlist   → always accessible, no check
 * - everything else → no auth check (marketing pages, /api/auth, static assets)
 *
 * NOTE: No cap check happens in middleware. The beta cap is enforced server-side
 * in the Better Auth `user.create.before` hook (lib/auth/server.ts), which throws
 * BETA_CAP_REACHED only on NEW user creation — existing users signing in are
 * never affected. Middleware doing a cap check would break existing-user login.
 *
 * We use `getSessionCookie` (not a DB lookup) for edge-runtime safety. It just
 * verifies the cookie's signature and presence; full session validation happens
 * in server components / API routes that call `auth.api.getSession()`.
 */

const APP_PREFIX = "/dashboard"; // (app) group lives at /dashboard, /decks, etc.
const APP_ROUTES = [
	"/dashboard",
	"/decks",
	"/review",
	"/mock-tests",
	"/cohorts",
	"/settings",
	"/onboarding",
];
const AUTH_ROUTES = ["/login", "/verify", "/error"];

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const sessionCookie = getSessionCookie(request);
	const isAuthed = Boolean(sessionCookie);

	const isAppRoute = APP_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
	const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

	if (isAppRoute && !isAuthed) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("next", pathname);
		return NextResponse.redirect(loginUrl);
	}

	if (isAuthRoute && isAuthed) {
		return NextResponse.redirect(new URL(APP_PREFIX, request.url));
	}

	return NextResponse.next();
}

export const config = {
	// Run on all routes except Next internals, static assets, and the auth API.
	matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
