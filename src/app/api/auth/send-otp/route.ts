
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Fetch manager email from Static table
        const managerEmailConfig = await prisma.static.findUnique({
            where: { key: "MANAGER_EMAIL" },
        });

        const managerEmail = managerEmailConfig?.value;

        if (!managerEmail) {
            console.error("MANAGER_EMAIL not set in Static table");
            return NextResponse.json({ error: "System configuration error" }, { status: 500 });
        }

        // Check if provided email matches manager email
        // Using simple string comparison. In production, might want constant time comparison if timing attacks are a concern,
        // but for this internal tool, it's acceptable.
        if (email.toLowerCase() !== managerEmail.toLowerCase()) {
            // Return success to prevent email enumeration
            return NextResponse.json({ message: "If the email is registered, an OTP has been sent." });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP
        await prisma.otp.upsert({
            where: { email: managerEmail },
            update: {
                code: otp,
                expiresAt,
            },
            create: {
                email: managerEmail,
                code: otp,
                expiresAt,
            },
        });

        // Send Email
        await sendEmail({
            to: managerEmail,
            subject: "Manager Login OTP",
            html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Manager Login Verification</h2>
          <p>Your OTP for login is:</p>
          <h1 style="letter-spacing: 5px; background: #f4f4f4; padding: 10px; display: inline-block;">${otp}</h1>
          <p>This code is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
        });

        return NextResponse.json({ message: "If the email is registered, an OTP has been sent." });
    } catch (error) {
        console.error("Error sending OTP:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
