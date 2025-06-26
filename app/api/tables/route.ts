import { NextResponse } from 'next/server'
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

    const tables = await prisma.table.findMany({
      include: {
        orders: {
          where: {
            status: 'OPEN'
          },
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: {
        number: 'asc'
      }
    })

    return NextResponse.json(tables)
  } catch (error) {
    return NextResponse.json(
      { error: 'Fehler beim Laden der Tische' },
      { status: 500 }
    )
  }
} 