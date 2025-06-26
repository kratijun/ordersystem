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

// Trust proxy für korrekte IP-Adressen hinter Reverse Proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 Minuten
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit pro IP
  message: {
    success: false,
    error: 'Zu viele Anfragen von dieser IP. Bitte versuche es später erneut.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS - Automatische Konfiguration basierend auf der Umgebung
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // In Development: localhost erlauben
    if (process.env.NODE_ENV === 'development') {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Nicht erlaubt durch CORS'), false);
      }
      return;
    }

    // In Production: Automatische Domain-Erkennung
    if (!origin) {
      // Requests ohne Origin (z.B. mobile apps, Postman) erlauben
      callback(null, true);
      return;
    }

    // Explizit gesetzte Frontend URL prüfen
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      callback(null, true);
      return;
    }

    // Automatische Domain-Erkennung für HTTPS
    const url = new URL(origin);
    if (url.protocol === 'https:' || url.hostname === 'localhost') {
      callback(null, true);
    } else {
      callback(new Error('Nicht erlaubt durch CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health Check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Orderman Backend läuft',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
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
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS: ${process.env.NODE_ENV === 'development' ? 'Development Mode' : 'Production Mode'}`);
  if (process.env.FRONTEND_URL) {
    console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL}`);
  }
  console.log(`⚡ Health Check: http://localhost:${PORT}/health`);
});

export default app; 