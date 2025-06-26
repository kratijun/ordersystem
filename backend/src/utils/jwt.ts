import jwt, { SignOptions } from 'jsonwebtoken';
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

  const options: SignOptions = {
    // @ts-ignore
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  };

  return jwt.sign(payload, secret, options);
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

  const options: SignOptions = {
    // @ts-ignore
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  };

  return jwt.sign({ userId }, secret, options);
}; 