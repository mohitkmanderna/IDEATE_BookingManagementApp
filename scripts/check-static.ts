import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const staticData = await prisma.static.findUnique({
        where: { key: 'logo_url' },
    });
    console.log('Static Data:', staticData);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
