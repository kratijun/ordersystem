import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Prisma Fehler
  if (error.code === 'P2002') {
    return res.status(400).json({
      success: false,
      error: 'Eindeutiger Wert bereits vorhanden'
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Datensatz nicht gefunden'
    });
  }

  // JWT Fehler
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Ungültiger Token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token abgelaufen'
    });
  }

  // Validation Fehler
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validierungsfehler',
      details: error.message
    });
  }

  // Standard Fehler
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Interner Serverfehler';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}; 