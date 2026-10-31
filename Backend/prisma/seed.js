const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    const electronics = await prisma.category.upsert({
        where: {
            slug: "electronics"
        },
        update: {},
        create: {
            name: "Electronics",
            slug: "electronics"
        }
    });

    const computers = await prisma.category.upsert({
        where: {
            slug: "computers-accessories"
        },
        update: {},
        create: {
            name: "Computers & Accessories",
            slug: "computers-accessories"
        }
    });

    const product = await prisma.product.upsert({
        where: {
            slug: "demo-laptop"
        },
        update: {},
        create: {
            name: "Demo Laptop",
            slug: "demo-laptop",
            description: "A demo laptop for our e-commerce platform",
            price: 75000,
            stock: 10,
            categoryId: computers.id
        }
    });

    console.log("Created categories:");
    console.log(electronics);
    console.log(computers);

    console.log("Created product:");
    console.log(product);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });