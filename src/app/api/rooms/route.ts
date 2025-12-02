import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany();
    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = slugify(name, { lower: true, strict: true });
    // Ensure uniqueness (simple check, could be improved)
    const existingRoom = await prisma.room.findUnique({ where: { id: slug } });
    if (existingRoom) {
      return NextResponse.json({ error: "Room with this name already exists" }, { status: 409 });
    }

    const room = await prisma.room.create({
      data: {
        id: slug,
        name,
        description,
      },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Rooms API Error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs array is required" }, { status: 400 });
    }

    // Delete associated bookings first (cascade delete simulation)
    await prisma.$transaction([
      prisma.booking.deleteMany({
        where: { roomId: { in: ids } },
      }),
      prisma.room.deleteMany({
        where: { id: { in: ids } },
      }),
    ]);

    return NextResponse.json({ message: "Rooms deleted successfully" });
  } catch (error) {
    console.error("Delete Rooms Error:", error);
    return NextResponse.json({ error: "Failed to delete rooms" }, { status: 500 });
  }
}
