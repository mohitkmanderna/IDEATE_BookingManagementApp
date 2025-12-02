
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting verification...");

    // 1. Create a dummy room
    const room = await prisma.room.create({
        data: {
            id: "verify-room-" + Date.now(),
            name: "Verification Room",
            description: "Room for verification",
        },
    });
    console.log("Created room:", room.id);

    // 2. Create a dummy booking
    const booking = await prisma.booking.create({
        data: {
            id: "verify-booking-" + Date.now(),
            userName: "Verifier",
            userEmail: "verifier@example.com",
            roomId: room.id,
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000),
            purpose: "Verification",
            status: "PENDING",
        },
    });
    console.log("Created booking:", booking.id);

    // 3. Age the booking
    const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
    await prisma.booking.update({
        where: { id: booking.id },
        data: { createdAt: fiftyHoursAgo },
    });
    console.log("Aged booking to:", fiftyHoursAgo);

    // 4. Trigger API
    console.log("Triggering API...");
    const res = await fetch("http://localhost:3000/api/bookings");
    if (!res.ok) {
        console.error("API failed:", res.status, res.statusText);
        process.exit(1);
    }
    const bookings = await res.json();

    // 5. Verify
    const updatedBooking = bookings.find((b: any) => b.id === booking.id);
    if (!updatedBooking) {
        console.error("Booking not found in API response");
        process.exit(1);
    }

    console.log("Booking status:", updatedBooking.status);
    console.log("Rejection reason:", updatedBooking.rejectionReason);

    if (updatedBooking.status === "REJECTED" && updatedBooking.rejectionReason === "Automatically Rejected after 48 hrs") {
        console.log("SUCCESS: Booking was automatically rejected.");
    } else {
        console.error("FAILURE: Booking was not rejected correctly.");
        process.exit(1);
    }

    // 6. Cleanup
    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.room.delete({ where: { id: room.id } });
    console.log("Cleanup done.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
