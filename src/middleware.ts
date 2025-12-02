
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect /manager routes
    if (pathname.startsWith("/manager")) {
        // Allow access to login page
        if (pathname === "/manager/login") {
            return NextResponse.next();
        }
        return await verifyToken(request);
    }

    // Protect API routes
    if (pathname.startsWith("/api")) {
        // Allow Auth APIs
        if (pathname.startsWith("/api/auth")) {
            return NextResponse.next();
        }

        // Allow Public Booking APIs
        // POST /api/bookings (Create)
        if (pathname === "/api/bookings" && request.method === "POST") {
            return NextResponse.next();
        }
        // GET /api/bookings/:id (Track) - Check if path has segments after /bookings
        if (pathname.startsWith("/api/bookings/") && pathname.split("/").length > 3 && request.method === "GET") {
            return NextResponse.next();
        }

        // Allow Public Room APIs
        // GET /api/rooms (List)
        if (pathname === "/api/rooms" && request.method === "GET") {
            return NextResponse.next();
        }

        // Protect everything else (Manager Actions: GET /api/bookings, PATCH, DELETE, POST /api/rooms, etc.)
        return await verifyToken(request);
    }

    return NextResponse.next();
}

async function verifyToken(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
        // For API, return 401 instead of redirect
        if (request.nextUrl.pathname.startsWith("/api")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/manager/login", request.url));
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch (error) {
        console.error("Token verification failed:", error);
        if (request.nextUrl.pathname.startsWith("/api")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/manager/login", request.url));
    }
}

export const config = {
    matcher: ["/manager/:path*", "/api/:path*"],
};
