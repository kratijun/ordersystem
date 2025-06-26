import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/utils/database';
import { AuthRequest } from '@/types';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get Users Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, password, role = 'WAITER' } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name und Passwort sind erforderlich'
      });
    }

    if (!['ADMIN', 'WAITER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige Rolle'
      });
    }

    // Prüfen ob Benutzer bereits existiert
    const existingUser = await prisma.user.findFirst({
      where: { name }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Benutzername bereits vergeben'
      });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 12);

    // Benutzer erstellen
    const user = await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Benutzer erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Create User Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, password } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Benutzer-ID ist erforderlich'
      });
    }

    // Prüfen ob Benutzer existiert
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Update-Daten vorbereiten
    const updateData: any = {};

    if (name && name !== existingUser.name) {
      // Prüfen ob neuer Name bereits vergeben
      const nameExists = await prisma.user.findFirst({
        where: { name, id: { not: id } }
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: 'Benutzername bereits vergeben'
        });
      }

      updateData.name = name;
    }

    if (role && ['ADMIN', 'WAITER'].includes(role)) {
      updateData.role = role;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Benutzer aktualisieren
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Benutzer erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Update User Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Benutzer-ID ist erforderlich'
      });
    }

    // Prüfen ob Benutzer existiert
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Prüfen ob der Benutzer sich selbst löschen möchte
    if (req.user?.id === id) {
      return res.status(400).json({
        success: false,
        error: 'Sie können sich nicht selbst löschen'
      });
    }

    // Benutzer löschen
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Benutzer erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Delete User Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, currentPassword, newPassword } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Nicht authentifiziert'
      });
    }

    // Aktuellen Benutzer laden
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    const updateData: any = {};

    // Name aktualisieren
    if (name && name !== user.name) {
      const nameExists = await prisma.user.findFirst({
        where: { name, id: { not: req.user.id } }
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: 'Benutzername bereits vergeben'
        });
      }

      updateData.name = name;
    }

    // Passwort aktualisieren
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: 'Aktuelles Passwort ist erforderlich'
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Aktuelles Passwort ist falsch'
        });
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Benutzer aktualisieren
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profil erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Update Profile Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
}; 