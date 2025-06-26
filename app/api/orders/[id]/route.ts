import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { status, items } = await request.json()

    // Bestellung aktualisieren
    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: {
        table: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Wenn neue Items hinzugefügt werden sollen
    if (items && items.length > 0) {
      await prisma.orderItem.createMany({
        data: items.map((item: any) => ({
          orderId: params.id,
          productId: item.productId,
          quantity: item.quantity
        }))
      })
    }

    // Wenn Bestellung als bezahlt markiert wird, Tisch freigeben
    if (status === 'PAID') {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'FREE' }
      })
    }

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Bestellung' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { status, items } = await request.json()

    // Bestellung aktualisieren
    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status },
      include: {
        table: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Wenn neue Items hinzugefügt werden sollen
    if (items && items.length > 0) {
      await prisma.orderItem.createMany({
        data: items.map((item: any) => ({
          orderId: params.id,
          productId: item.productId,
          quantity: item.quantity
        }))
      })
    }

    // Wenn Bestellung als bezahlt markiert wird, Tisch freigeben
    if (status === 'PAID') {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'FREE' }
      })
    }

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Bestellung' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Bestellung vor dem Löschen abrufen, um Tisch-ID zu erhalten
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { table: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden' },
        { status: 404 }
      )
    }

    // Erst alle OrderItems löschen
    await prisma.orderItem.deleteMany({
      where: { orderId: params.id }
    })

    // Dann die Bestellung löschen
    await prisma.order.delete({
      where: { id: params.id }
    })

    // Tisch auf FREE setzen, falls er OCCUPIED war
    if (order.table.status === 'OCCUPIED') {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'FREE' }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Bestellung' },
      { status: 500 }
    )
  }
} 