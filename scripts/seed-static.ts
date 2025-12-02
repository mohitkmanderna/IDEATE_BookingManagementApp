import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const logoUrl = 'https://s3.us-east-1.amazonaws.com/jms.public/static/ideate+booking/ideate_lab_logo.jpg';

    const existing = await prisma.static.findUnique({
        where: { key: 'logo_url' },
    });

    if (!existing) {
        await prisma.static.create({
            data: {
                key: 'logo_url',
                value: logoUrl,
            },
        });
        console.log('Seeded logo_url');
    } else {
        console.log('logo_url already exists');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
