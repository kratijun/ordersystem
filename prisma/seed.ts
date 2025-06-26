import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Benutzer erstellen
  const adminPassword = await bcrypt.hash('admin123', 10)
  const waiterPassword = await bcrypt.hash('waiter123', 10)

  // Lösche bestehende Benutzer falls vorhanden
  await prisma.user.deleteMany({})
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      role: 'ADMIN',
      password: adminPassword,
    },
  })

  const waiter = await prisma.user.create({
    data: {
      name: 'Kellner Max',
      role: 'WAITER',
      password: waiterPassword,
    },
  })

  // Lösche bestehende Tische falls vorhanden
  await prisma.table.deleteMany({})
  
  // Tische erstellen
  const tables = []
  for (let i = 1; i <= 10; i++) {
    const table = await prisma.table.create({
      data: {
        number: i,
        status: 'FREE',
      },
    })
    tables.push(table)
  }

  // Produkte erstellen
  const products = [
    { name: 'Schnitzel Wiener Art', price: 12.50, category: 'Hauptgerichte' },
    { name: 'Schweinebraten', price: 14.00, category: 'Hauptgerichte' },
    { name: 'Gulasch', price: 11.50, category: 'Hauptgerichte' },
    { name: 'Bratwurst mit Sauerkraut', price: 9.50, category: 'Hauptgerichte' },
    { name: 'Sauerbraten', price: 13.50, category: 'Hauptgerichte' },
    { name: 'Gemischter Salat', price: 6.50, category: 'Vorspeisen' },
    { name: 'Suppe des Tages', price: 4.50, category: 'Vorspeisen' },
    { name: 'Brotzeit-Teller', price: 8.50, category: 'Vorspeisen' },
    { name: 'Apfelstrudel', price: 5.50, category: 'Desserts' },
    { name: 'Kaiserschmarrn', price: 6.50, category: 'Desserts' },
    { name: 'Eis (3 Kugeln)', price: 4.50, category: 'Desserts' },
    { name: 'Weissbier 0,5l', price: 3.50, category: 'Getränke' },
    { name: 'Pils 0,4l', price: 3.00, category: 'Getränke' },
    { name: 'Apfelsaft 0,3l', price: 2.50, category: 'Getränke' },
    { name: 'Cola 0,3l', price: 2.50, category: 'Getränke' },
    { name: 'Mineralwasser 0,5l', price: 2.00, category: 'Getränke' },
  ]

  // Lösche bestehende Produkte falls vorhanden
  await prisma.product.deleteMany({})
  
  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }
  console.log('Seed-Daten erfolgreich erstellt!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  }) 