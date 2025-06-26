import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id

    // Verhindere das Löschen des eigenen Accounts
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    await prisma.user.delete({
      where: {
        id: userId
      }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = params.id
    const requestData = await request.json()

    // Prüfe ob es sich um ein Profil-Update (eigener Account) oder Admin-Update handelt
    const isProfileUpdate = userId === session.user.id
    const isAdminUpdate = session.user.role === 'ADMIN' && userId !== session.user.id

    if (!isProfileUpdate && !isAdminUpdate) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Profil-Update (eigener Account)
    if (isProfileUpdate) {
      const { name, currentPassword, newPassword } = requestData

      if (!name) {
        return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
      }

      // Wenn Passwort geändert werden soll
      if (newPassword) {
        if (!currentPassword) {
          return NextResponse.json({ error: 'Aktuelles Passwort ist erforderlich' }, { status: 400 })
        }

        // Aktuelles Passwort prüfen
        const user = await prisma.user.findUnique({
          where: { id: userId }
        })

        if (!user) {
          return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
        if (!isCurrentPasswordValid) {
          return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
        }

        // Neues Passwort hashen
        const hashedNewPassword = await bcrypt.hash(newPassword, 12)

        // Name und Passwort aktualisieren
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            name,
            password: hashedNewPassword
          },
          select: {
            id: true,
            name: true,
            role: true
          }
        })

        return NextResponse.json(updatedUser)
      } else {
        // Nur Name aktualisieren
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { name },
          select: {
            id: true,
            name: true,
            role: true
          }
        })

        return NextResponse.json(updatedUser)
      }
    }

    // Admin-Update (anderer Benutzer)
    if (isAdminUpdate) {
      const { name, role } = requestData

      if (!name || !role) {
        return NextResponse.json({ error: 'Name und Rolle sind erforderlich' }, { status: 400 })
      }

      if (!['ADMIN', 'WAITER'].includes(role)) {
        return NextResponse.json({ error: 'Ungültige Rolle' }, { status: 400 })
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { name, role },
        select: {
          id: true,
          name: true,
          role: true
        }
      })

      return NextResponse.json(user)
    }

  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzers:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 