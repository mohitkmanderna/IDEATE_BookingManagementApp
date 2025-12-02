
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Testing Prisma Client...");
    try {
        const booking = await prisma.booking.findFirst();
        console.log("Booking found:", booking);
        // Check if we can select the new field (even if undefined in runtime if not selected, but types should allow it)
        // Actually, let's try to create one with the field
        const room = await prisma.room.findFirst();
        if (!room) {
            console.log("No room found, skipping create");
            return;
        }

        const newBooking = await prisma.booking.create({
            data: {
                id: "test-reason-" + Date.now(),
                userName: "Test",
                userEmail: "test@example.com",
                roomId: room.id,
                startTime: new Date(),
                endTime: new Date(),
                purpose: "Test Reason",
                rejectionReason: "Test Reason Field",
            }
        });
        console.log("Created booking with reason:", newBooking);

        await prisma.booking.delete({ where: { id: newBooking.id } });
    } catch (e) {
        console.error("Prisma Error:", e);
        process.exit(1);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
