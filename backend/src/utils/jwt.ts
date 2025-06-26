import jwt from 'jsonwebtoken';
import { AuthUser, JwtPayload } from '@/types';

export const generateToken = (user: AuthUser): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET nicht konfiguriert');
  }

  const payload: JwtPayload = {
    userId: user.id,
    name: user.name,
    role: user.role
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET nicht konfiguriert');
  }

  return jwt.verify(token, secret) as JwtPayload;
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET nicht konfiguriert');
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
}; 