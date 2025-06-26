import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      include: {
        table: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Bestellungen' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { tableId, items } = await request.json()

    // Prüfen ob bereits eine offene Bestellung für den Tisch existiert
    const existingOrder = await prisma.order.findFirst({
      where: {
        tableId,
        status: 'OPEN'
      }
    })

    if (existingOrder) {
      return NextResponse.json(
        { error: 'Für diesen Tisch existiert bereits eine offene Bestellung' },
        { status: 400 }
      )
    }

    // Neue Bestellung erstellen
    const order = await prisma.order.create({
      data: {
        tableId,
        userId: session.user.id,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        }
      },
      include: {
        table: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Tischstatus auf OCCUPIED setzen
    await prisma.table.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' }
    })

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Bestellung' },
      { status: 500 }
    )
  }
} 