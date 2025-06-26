import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@/utils/database';
import { generateToken } from '@/utils/jwt';
import { LoginRequest, AuthRequest } from '@/types';

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name und Passwort sind erforderlich'
      });
    }

    // Benutzer suchen
    const user = await prisma.user.findFirst({
      where: { name }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Ungültige Anmeldedaten'
      });
    }

    // Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Ungültige Anmeldedaten'
      });
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

export const register = async (req: Request, res: Response) => {
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
    console.error('Registrierung Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler'
    });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Nicht authentifiziert'
      });
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
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
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