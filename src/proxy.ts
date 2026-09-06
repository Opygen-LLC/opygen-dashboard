import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

const authMiddleware = withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        const isAuthPage =
            path === "/login" ||
            path === "/forgot-password" ||
            path === "/reset-password";

        // If user is authenticated with a valid token
        if (token) {
            // 1. Force password change redirection if flag is active
            if (token.needPasswordChange) {
                if (path !== "/change-password" && !path.startsWith("/api/auth/")) {
                    if (
                        path.startsWith("/api/") &&
                        path !== "/api/users/change-password"
                    ) {
                        return new NextResponse(
                            JSON.stringify({ error: "Password change required" }),
                            {
                                status: 403,
                                headers: { "Content-Type": "application/json" },
                            },
                        );
                    }
                    if (!path.startsWith("/api/")) {
                        return NextResponse.redirect(
                            new URL("/change-password", req.url),
                        );
                    }
                }
            } else {
                // If user does not need password change, prevent visiting /change-password
                if (path === "/change-password") {
                    const target =
                        token.role === "admin" ? "/admin-dashboard" : "/dashboard";
                    return NextResponse.redirect(new URL(target, req.url));
                }
            }

            // 2. Redirect logged-in users away from auth pages or root landing to their role dashboard
            if (isAuthPage || path === "/") {
                if (token.needPasswordChange) {
                    return NextResponse.redirect(
                        new URL("/change-password", req.url),
                    );
                }
                const target =
                    token.role === "admin" ? "/admin-dashboard" : "/dashboard";
                return NextResponse.redirect(new URL(target, req.url));
            }

            // 3. Admin-only route restrictions
            if (
                path.startsWith("/admin-dashboard") ||
                path.startsWith("/api/users/add") ||
                path.startsWith("/api/admin")
            ) {
                if (token.role !== "admin") {
                    if (path.startsWith("/api/")) {
                        return new NextResponse(
                            JSON.stringify({ error: "Unauthorized" }),
                            {
                                status: 403,
                                headers: { "Content-Type": "application/json" },
                            },
                        );
                    }
                    return NextResponse.redirect(new URL("/dashboard", req.url));
                }
            }

            // 4. Member route restrictions (redirect admins attempting to view /dashboard to /admin-dashboard)
            if (
                path.startsWith("/dashboard") &&
                path !== "/dashboard/change-password"
            ) {
                if (token.role === "admin") {
                    return NextResponse.redirect(
                        new URL("/admin-dashboard", req.url),
                    );
                }
            }
        } else {
            // Unauthenticated visitors to root landing get sent to /login
            if (path === "/") {
                return NextResponse.redirect(new URL("/login", req.url));
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const path = req.nextUrl.pathname;
                // Allow public access to landing, auth pages, and client portal routes
                if (
                    path === "/" ||
                    path === "/login" ||
                    path === "/forgot-password" ||
                    path === "/reset-password" ||
                    path.startsWith("/portal") ||
                    path.startsWith("/api/portal")
                ) {
                    return true;
                }
                return !!token;
            },
        },
        pages: {
            signIn: "/login",
        },
    },
);

export function proxy(req: NextRequest, event: any) {
    return (authMiddleware as any)(req, event);
}

export const config = {
    matcher: [
        "/",
        "/login",
        "/forgot-password",
        "/reset-password",
        "/dashboard/:path*",
        "/admin-dashboard/:path*",
        "/change-password",
        "/api/projects/:path*",
        "/api/users/:path*",
        "/api/admin/:path*",
        "/api/dashboard/:path*",
        "/api/upload/:path*",
    ],
};
