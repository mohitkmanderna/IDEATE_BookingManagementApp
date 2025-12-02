import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getManagerEmailHtml, getUserCreationEmailHtml, getManagerEmail } from "@/lib/email";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const roomId = searchParams.get("roomId");

    try {
        // Auto-reject pending bookings older than 48 hours
        const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
        await prisma.booking.updateMany({
            where: {
                status: "PENDING",
                createdAt: {
                    lt: cutoffTime,
                },
            },
            data: {
                status: "REJECTED",
                rejectionReason: "Automatically Rejected after 48 hrs",
            },
        });

        const where: any = {};
        if (status) where.status = status;
        if (roomId) where.roomId = roomId;

        const bookings = await prisma.booking.findMany({
            where,
            include: {
                room: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(bookings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userName, userEmail, roomId, startTime, endTime, purpose } = body;

        if (!userName || !userEmail || !roomId || !startTime || !endTime || !purpose) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Basic validation: check if room exists
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Check for overlaps
        // Overlap if (StartA < EndB) and (EndA > StartB)
        const start = new Date(startTime);
        const end = new Date(endTime);

        const conflictingBooking = await prisma.booking.findFirst({
            where: {
                roomId,
                status: { in: ["PENDING", "APPROVED"] },
                AND: [
                    { startTime: { lt: end } },
                    { endTime: { gt: start } },
                ],
            },
        });

        if (conflictingBooking) {
            return NextResponse.json(
                { error: "Time slot already booked or pending approval" },
                { status: 409 }
            );
        }

        // Generate custom ID: JGU + 5 random digits
        let bookingId = "";
        let isUnique = false;
        let retries = 0;

        while (!isUnique && retries < 5) {
            const randomDigits = Math.floor(10000 + Math.random() * 90000); // 10000 to 99999
            bookingId = `JGU${randomDigits}`;

            const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
            if (!existing) {
                isUnique = true;
            }
            retries++;
        }

        if (!isUnique) {
            return NextResponse.json({ error: "Failed to generate unique Booking ID" }, { status: 500 });
        }

        const booking = await prisma.booking.create({
            data: {
                id: bookingId,
                userName,
                userEmail,
                roomId,
                startTime: start,
                endTime: end,
                purpose,
                status: "PENDING",
            },
        });

        // Send email to manager
        try {
            const managerEmail = await getManagerEmail();
            await sendEmail({
                to: managerEmail,
                subject: `New Booking Request: ${room.name}`,
                html: getManagerEmailHtml({ ...booking, room }),
            });
        } catch (emailError) {
            console.error("Failed to send manager email:", emailError);
        }

        // Send email to user (Creation)
        try {
            await sendEmail({
                to: userEmail,
                subject: `Booking Request Received: ${room.name}`,
                html: getUserCreationEmailHtml({ ...booking, room }),
            });
        } catch (emailError) {
            console.error("Failed to send user creation email:", emailError);
        }

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        console.error("Bookings API Error:", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "IDs array is required" }, { status: 400 });
        }

        await prisma.booking.deleteMany({
            where: {
                id: { in: ids },
            },
        });

        return NextResponse.json({ message: "Bookings deleted successfully" });
    } catch (error) {
        console.error("Delete Bookings Error:", error);
        return NextResponse.json({ error: "Failed to delete bookings" }, { status: 500 });
    }
}
