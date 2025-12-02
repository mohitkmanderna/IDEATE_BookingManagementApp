
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'mohit.mk2809@gmail.com';

    console.log(`Seeding manager email: ${email}`);

    const result = await prisma.static.upsert({
        where: { key: 'MANAGER_EMAIL' },
        update: { value: email },
        create: {
            key: 'MANAGER_EMAIL',
            value: email,
        },
    });

    console.log('Seeded:', result);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
