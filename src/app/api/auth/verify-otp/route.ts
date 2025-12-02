
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this"; // Should be in env

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
        }

        // Verify OTP
        const storedOtp = await prisma.otp.findUnique({
            where: { email },
        });

        if (!storedOtp) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
        }

        if (storedOtp.code !== otp) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
        }

        if (new Date() > storedOtp.expiresAt) {
            return NextResponse.json({ error: "OTP expired" }, { status: 400 });
        }

        // OTP is valid, generate JWT
        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({ role: "manager", email })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("72h")
            .sign(secret);

        // Set Cookie
        const cookieStore = await cookies();
        cookieStore.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 72 * 60 * 60, // 72 hours
            path: "/",
        });

        // Delete used OTP
        await prisma.otp.delete({
            where: { email },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
