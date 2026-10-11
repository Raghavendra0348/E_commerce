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

    const laptops = await prisma.category.upsert({
        where: {
            slug: "laptops"
        },
        update: {},
        create: {
            name: "Laptops",
            slug: "laptops"
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
            categoryId: laptops.id
        }
    });

    console.log("Created categories:");
    console.log(electronics);
    console.log(laptops);

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