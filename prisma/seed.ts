// prisma/seed.ts
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Basic fiat assets
    await prisma.asset.createMany({
        data: [
            { symbol: "EUR", name: "Euro", type: "FIAT" },
            { symbol: "USD", name: "US Dollar", type: "FIAT" },
        ],
        skipDuplicates: true,
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
