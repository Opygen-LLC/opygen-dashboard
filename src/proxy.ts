import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

const authMiddleware = withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // 1. Force password change redirection
        if (token?.needPasswordChange) {
            if (path !== "/change-password" && !path.startsWith("/api/auth/")) {
                // Block other APIs, but let standard change-password execution pass
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
            if (path === "/change-password") {
                const target =
                    token?.role === "admin" ? "/admin-dashboard" : "/dashboard";
                return NextResponse.redirect(new URL(target, req.url));
            }
        }

        // 2. Role restrictions
        if (
            path.startsWith("/admin-dashboard") ||
            path.startsWith("/api/users/add")
        ) {
            if (token?.role !== "admin") {
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

        if (
            path.startsWith("/dashboard") &&
            path !== "/dashboard/change-password"
        ) {
            if (token?.role === "admin") {
                return NextResponse.redirect(
                    new URL("/admin-dashboard", req.url),
                );
            }
        }

        return NextResponse.next();
    },
    {
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
        "/dashboard/:path*",
        "/admin-dashboard/:path*",
        "/change-password",
        "/api/projects/:path*",
        "/api/users/:path*",
        "/api/dashboard/:path*",
    ],
};
