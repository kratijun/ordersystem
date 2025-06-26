import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/utils/database';
import { generateToken } from '@/utils/jwt';
import { LoginRequest, AuthRequest } from '@/types';

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      res.status(400).json({
        success: false,
        error: 'Name und Passwort sind erforderlich'
      });
      return;
    }

    // Benutzer suchen
    const user = await prisma.user.findFirst({
      where: { name }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Ungültige Anmeldedaten'
      });
      return;
    }

    // Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Ungültige Anmeldedaten'
      });
      return;
    }

    // Token generieren
    const authUser = {
      id: user.id,
      name: user.name,
      role: user.role as 'ADMIN' | 'WAITER'
    };

    const token = generateToken(authUser);

    res.json({
      success: true,
      data: {
        user: authUser,
        token
      },
      message: 'Erfolgreich angemeldet'
    });

  } catch (error) {
    console.error('Login Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password, role = 'WAITER' } = req.body;

    if (!name || !password) {
      res.status(400).json({
        success: false,
        error: 'Name und Passwort sind erforderlich'
      });
      return;
    }

    if (!['ADMIN', 'WAITER'].includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Ungültige Rolle'
      });
      return;
    }

    // Prüfen ob Benutzer bereits existiert
    const existingUser = await prisma.user.findFirst({
      where: { name }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Benutzername bereits vergeben'
      });
      return;
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
    console.error('Registrierung Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Nicht authentifiziert'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Me Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
}; 