import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Benutzer erstellen
  const hashedPassword = await bcrypt.hash('123456', 12);

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

  // Tische erstellen
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

  // Produkte erstellen
  const products = [
    // Getränke
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

    // Vorspeisen
    { name: 'Bruschetta', price: 6.50, category: 'Vorspeisen' },
    { name: 'Antipasti', price: 8.90, category: 'Vorspeisen' },
    { name: 'Caprese', price: 7.50, category: 'Vorspeisen' },
    { name: 'Suppe des Tages', price: 5.50, category: 'Vorspeisen' },

    // Hauptgerichte
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

    // Desserts
    { name: 'Tiramisu', price: 5.50, category: 'Desserts' },
    { name: 'Panna Cotta', price: 4.90, category: 'Desserts' },
    { name: 'Eis (3 Kugeln)', price: 4.50, category: 'Desserts' },
    { name: 'Schokoladenkuchen', price: 5.90, category: 'Desserts' },

    // Salate
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

  // Beispiel-Bestellungen erstellen
  const sampleOrder = await prisma.order.create({
    data: {
      tableId: tables[0].id,
      userId: waiter.id,
      status: 'OPEN',
      items: {
        create: [
          {
            productId: (await prisma.product.findFirst({ where: { name: 'Pizza Margherita' } }))!.id,
            quantity: 2,
            status: 'ORDERED'
          },
          {
            productId: (await prisma.product.findFirst({ where: { name: 'Coca Cola' } }))!.id,
            quantity: 2,
            status: 'SERVED'
          }
        ]
      }
    }
  });

  // Tisch als besetzt markieren
  await prisma.table.update({
    where: { id: tables[0].id },
    data: { status: 'OCCUPIED' }
  });

  console.log('✅ Beispiel-Bestellung erstellt');

  // Bezahlte Bestellung für Statistiken
  const paidOrder = await prisma.order.create({
    data: {
      tableId: tables[1].id,
      userId: waiter.id,
      status: 'PAID',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Gestern
      items: {
        create: [
          {
            productId: (await prisma.product.findFirst({ where: { name: 'Steak' } }))!.id,
            quantity: 1,
            status: 'SERVED'
          },
          {
            productId: (await prisma.product.findFirst({ where: { name: 'Wein rot' } }))!.id,
            quantity: 2,
            status: 'SERVED'
          },
          {
            productId: (await prisma.product.findFirst({ where: { name: 'Tiramisu' } }))!.id,
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