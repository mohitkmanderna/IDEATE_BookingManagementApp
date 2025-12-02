import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getUserEmailHtml } from "@/lib/email";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check and auto-reject if this specific booking is pending and expired
        const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const pendingExpired = await prisma.booking.findFirst({
            where: {
                id,
                status: "PENDING",
                createdAt: {
                    lt: cutoffTime,
                },
            },
        });

        if (pendingExpired) {
            await prisma.booking.update({
                where: { id },
                data: {
                    status: "REJECTED",
                    rejectionReason: "Automatically Rejected after 48 hrs",
                },
            });
        }

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { room: true },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Booking Details API Error:", error);
        return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status || !["APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const booking = await prisma.booking.update({
            where: { id },
            data: { status },
            include: { room: true },
        });

        // Send email to user
        try {
            await sendEmail({
                to: booking.userEmail,
                subject: `Booking Status Update: ${status}`,
                html: getUserEmailHtml(booking, status),
            });
        } catch (emailError) {
            console.error("Failed to send user email:", emailError);
        }

        return NextResponse.json(booking);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
    }
}
