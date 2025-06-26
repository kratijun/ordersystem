"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const hashedPassword = await bcryptjs_1.default.hash('123456', 12);
    const admin = await prisma.user.upsert({
        where: { name: 'admin' },
        update: {},
        create: {
            name: 'admin',
            password: hashedPassword,
            role: 'ADMIN'
        }
    });
    const waiter = await prisma.user.upsert({
        where: { name: 'kellner' },
        update: {},
        create: {
            name: 'kellner',
            password: hashedPassword,
            role: 'WAITER'
        }
    });
    console.log('✅ Benutzer erstellt:', { admin: admin.name, waiter: waiter.name });
    const tables = [];
    for (let i = 1; i <= 12; i++) {
        const table = await prisma.table.upsert({
            where: { number: i },
            update: {},
            create: {
                number: i,
                status: 'FREE'
            }
        });
        tables.push(table);
    }
    console.log('✅ Tische erstellt:', tables.length);
    const products = [
        { name: 'Coca Cola', price: 2.50, category: 'Getränke' },
        { name: 'Fanta', price: 2.50, category: 'Getränke' },
        { name: 'Sprite', price: 2.50, category: 'Getränke' },
        { name: 'Wasser', price: 2.00, category: 'Getränke' },
        { name: 'Bier', price: 3.50, category: 'Getränke' },
        { name: 'Wein rot', price: 4.50, category: 'Getränke' },
        { name: 'Wein weiß', price: 4.50, category: 'Getränke' },
        { name: 'Kaffee', price: 2.80, category: 'Getränke' },
        { name: 'Cappuccino', price: 3.20, category: 'Getränke' },
        { name: 'Espresso', price: 2.50, category: 'Getränke' },
        { name: 'Bruschetta', price: 6.50, category: 'Vorspeisen' },
        { name: 'Antipasti', price: 8.90, category: 'Vorspeisen' },
        { name: 'Caprese', price: 7.50, category: 'Vorspeisen' },
        { name: 'Suppe des Tages', price: 5.50, category: 'Vorspeisen' },
        { name: 'Spaghetti Carbonara', price: 12.50, category: 'Hauptgerichte' },
        { name: 'Pizza Margherita', price: 9.50, category: 'Hauptgerichte' },
        { name: 'Pizza Salami', price: 11.50, category: 'Hauptgerichte' },
        { name: 'Pizza Prosciutto', price: 12.90, category: 'Hauptgerichte' },
        { name: 'Lasagne', price: 13.50, category: 'Hauptgerichte' },
        { name: 'Risotto', price: 11.90, category: 'Hauptgerichte' },
        { name: 'Schnitzel Wien', price: 14.50, category: 'Hauptgerichte' },
        { name: 'Steak', price: 18.90, category: 'Hauptgerichte' },
        { name: 'Lachs', price: 16.50, category: 'Hauptgerichte' },
        { name: 'Hähnchenbrust', price: 13.90, category: 'Hauptgerichte' },
        { name: 'Tiramisu', price: 5.50, category: 'Desserts' },
        { name: 'Panna Cotta', price: 4.90, category: 'Desserts' },
        { name: 'Eis (3 Kugeln)', price: 4.50, category: 'Desserts' },
        { name: 'Schokoladenkuchen', price: 5.90, category: 'Desserts' },
        { name: 'Caesar Salad', price: 8.50, category: 'Salate' },
        { name: 'Gemischter Salat', price: 6.90, category: 'Salate' },
        { name: 'Tomatensalat', price: 5.50, category: 'Salate' },
        { name: 'Griechischer Salat', price: 7.90, category: 'Salate' }
    ];
    for (const productData of products) {
        await prisma.product.upsert({
            where: {
                name_category: {
                    name: productData.name,
                    category: productData.category
                }
            },
            update: {},
            create: productData
        });
    }
    console.log('✅ Produkte erstellt:', products.length);
    const sampleOrder = await prisma.order.create({
        data: {
            tableId: tables[0].id,
            userId: waiter.id,
            status: 'OPEN',
            items: {
                create: [
                    {
                        productId: (await prisma.product.findFirst({ where: { name: 'Pizza Margherita' } })).id,
                        quantity: 2,
                        status: 'ORDERED'
                    },
                    {
                        productId: (await prisma.product.findFirst({ where: { name: 'Coca Cola' } })).id,
                        quantity: 2,
                        status: 'SERVED'
                    }
                ]
            }
        }
    });
    await prisma.table.update({
        where: { id: tables[0].id },
        data: { status: 'OCCUPIED' }
    });
    console.log('✅ Beispiel-Bestellung erstellt');
    const paidOrder = await prisma.order.create({
        data: {
            tableId: tables[1].id,
            userId: waiter.id,
            status: 'PAID',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            items: {
                create: [
                    {
                        productId: (await prisma.product.findFirst({ where: { name: 'Steak' } })).id,
                        quantity: 1,
                        status: 'SERVED'
                    },
                    {
                        productId: (await prisma.product.findFirst({ where: { name: 'Wein rot' } })).id,
                        quantity: 2,
                        status: 'SERVED'
                    },
                    {
                        productId: (await prisma.product.findFirst({ where: { name: 'Tiramisu' } })).id,
                        quantity: 1,
                        status: 'SERVED'
                    }
                ]
            }
        }
    });
    console.log('✅ Bezahlte Bestellung für Statistiken erstellt');
    console.log('🎉 Database seeding completed!');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map