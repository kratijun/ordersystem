import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '@/types';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Zugriff verweigert. Kein Token bereitgestellt.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET nicht konfiguriert');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = {
      id: decoded.userId,
      name: decoded.name,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Ungültiger Token'
    });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentifizierung erforderlich'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Administrator-Rechte erforderlich'
    });
  }

  next();
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentifizierung erforderlich'
    });
  }
  next();
}; 