import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const { status } = await request.json()

    const orderItem = await prisma.orderItem.update({
      where: { id: params.id },
      data: { status },
      include: {
        product: true,
        order: {
          include: {
            table: true
          }
        }
      }
    })

    return NextResponse.json(orderItem)
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Bestellposition' },
      { status: 500 }
    )
  }
} 