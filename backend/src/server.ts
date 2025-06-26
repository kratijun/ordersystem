import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Routes importieren
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import tableRoutes from '@/routes/tables';
import productRoutes from '@/routes/products';
import orderRoutes from '@/routes/orders';
import orderItemRoutes from '@/routes/orderItems';
import statisticsRoutes from '@/routes/statistics';

// Middleware importieren
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';

// Umgebungsvariablen laden
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Limit auf 100 Requests pro windowMs
  message: 'Zu viele Anfragen von dieser IP, versuchen Sie es später erneut.'
});
app.use(limiter);

// CORS Konfiguration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Orderman Backend läuft',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/statistics', statisticsRoutes);

// 404 Handler
app.use(notFound);

// Error Handler
app.use(errorHandler);

// Server starten
app.listen(PORT, () => {
  console.log(`🚀 Orderman Backend läuft auf Port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
});

export default app; 