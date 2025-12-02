"use server";

import { prisma } from "@/lib/prisma";

export async function getLogoUrl() {
    try {
        const staticData = await prisma.static.findUnique({
            where: {
                key: "logo_url",
            },
        });
        return staticData?.value;
    } catch (error) {
        console.error("Failed to fetch logo URL:", error);
        return null;
    }
}
