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

    const { status } = await request.json()

    const table = await prisma.table.update({
      where: { id: params.id },
      data: { status }
    })

    return NextResponse.json(table)
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Tisches' },
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

    const data = await request.json()

    const table = await prisma.table.update({
      where: { id: params.id },
      data: {
        status: data.status,
        reservationName: data.reservationName || null,
        reservationPhone: data.reservationPhone || null,
        reservationDate: data.reservationDate || null,
        reservationTime: data.reservationTime || null,
        reservationGuests: data.reservationGuests || null,
        closedReason: data.closedReason || null,
      }
    })

    return NextResponse.json(table)
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Tisches:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Tisches' },
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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Prüfe ob der Tisch aktive Bestellungen hat
    const tableWithOrders = await prisma.table.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          where: {
            status: {
              in: ['PENDING', 'PREPARING', 'READY']
            }
          }
        }
      }
    })

    if (tableWithOrders?.orders.length && tableWithOrders.orders.length > 0) {
      return NextResponse.json(
        { error: 'Tisch kann nicht gelöscht werden - es gibt noch aktive Bestellungen' },
        { status: 400 }
      )
    }

    await prisma.table.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Löschen des Tisches:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Tisches' },
      { status: 500 }
    )
  }
} 