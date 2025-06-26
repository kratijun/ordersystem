# 🚀 Orderman Backend - Express.js API Server

Das Backend des Orderman Restaurant-Bestellsystems. Ein robuster Express.js Server mit TypeScript, Prisma ORM und JWT-Authentifizierung.

## 📋 Inhaltsverzeichnis

- [Überblick](#überblick)
- [Technologie-Stack](#technologie-stack)
- [Installation](#installation)
- [API-Endpunkte](#api-endpunkte)
- [Datenbankschema](#datenbankschema)
- [Authentifizierung](#authentifizierung)
- [Entwicklung](#entwicklung)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🔍 Überblick

Das Backend stellt eine vollständige REST API für das Restaurant-Bestellsystem bereit:

- **🔐 JWT-Authentifizierung** mit Rollen-basierter Zugriffskontrolle
- **📊 SQLite Database** mit Prisma ORM für einfache Entwicklung
- **🛡️ Security Features** mit Helmet, CORS und Rate Limiting
- **📝 TypeScript** für Type Safety und bessere Entwicklererfahrung
- **🔄 Hot Reload** mit Nodemon für schnelle Entwicklung

## 🛠️ Technologie-Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Sprache**: TypeScript 5.x
- **Database**: SQLite 3
- **ORM**: Prisma 5.x
- **Authentication**: JWT + bcryptjs
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Morgan
- **Development**: Nodemon, ts-node

## 🚀 Installation

### Voraussetzungen
- Node.js 18 oder höher
- npm 8 oder höher

### Setup
```bash
# In Backend-Verzeichnis wechseln
cd backend

# Dependencies installieren
npm install

# Environment-Datei erstellen
cp .env.example .env

# Datenbank initialisieren
npx prisma db push

# Test-Daten laden
npx prisma db seed

# Development Server starten
npm run dev
```

### Environment Variables (.env)
```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (Mindestens 32 Zeichen)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Server
PORT=5000
NODE_ENV=development

# CORS (Optional)
FRONTEND_URL=http://localhost:3000

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📡 API-Endpunkte

### 🔐 Authentication
```http
POST   /api/auth/login      # Benutzer-Anmeldung
POST   /api/auth/register   # Benutzer-Registrierung
GET    /api/auth/me         # Aktueller Benutzer
```

### 👥 Users (Admin only)
```http
GET    /api/users           # Alle Benutzer auflisten
POST   /api/users           # Neuen Benutzer erstellen
PUT    /api/users/:id       # Benutzer aktualisieren
DELETE /api/users/:id       # Benutzer löschen
PUT    /api/users/profile   # Eigenes Profil aktualisieren
```

### 🪑 Tables
```http
GET    /api/tables          # Alle Tische auflisten
GET    /api/tables/:id      # Tisch Details
POST   /api/tables          # Neuen Tisch erstellen (Admin)
PUT    /api/tables/:id      # Tisch aktualisieren
DELETE /api/tables/:id      # Tisch löschen (Admin)
PUT    /api/tables/:id/reserve   # Tisch reservieren
PUT    /api/tables/:id/close     # Tisch schließen
```

### 🍽️ Products (Admin only)
```http
GET    /api/products         # Alle Produkte auflisten
GET    /api/products/categories  # Verfügbare Kategorien
POST   /api/products         # Neues Produkt erstellen
PUT    /api/products/:id     # Produkt aktualisieren
DELETE /api/products/:id     # Produkt löschen
```

### 📋 Orders
```http
GET    /api/orders           # Alle Bestellungen auflisten
GET    /api/orders/:id       # Bestellung Details
POST   /api/orders           # Neue Bestellung erstellen
PUT    /api/orders/:id       # Bestellung aktualisieren
DELETE /api/orders/:id       # Bestellung löschen
```

### 🛒 Order Items
```http
GET    /api/order-items      # Alle Bestellartikel auflisten
PUT    /api/order-items/:id  # Artikel Status aktualisieren
DELETE /api/order-items/:id  # Artikel aus Bestellung entfernen
```

### 📊 Statistics (Admin only)
```http
GET    /api/statistics       # Allgemeine Statistiken
POST   /api/statistics/export # Statistiken exportieren
```

### ❤️ Health Check
```http
GET    /health               # Server Status prüfen
```

## 🗄️ Datenbankschema

### User
```prisma
model User {
  id        String   @id @default(cuid())
  name      String   @unique
  password  String
  role      Role     @default(WAITER)
  createdAt DateTime @default(now())
  orders    Order[]
}

enum Role {
  ADMIN
  WAITER
}
```

### Table
```prisma
model Table {
  id                String   @id @default(cuid())
  number            Int      @unique
  status            TableStatus @default(FREE)
  reservationName   String?
  reservationPhone  String?
  reservationDate   String?
  reservationTime   String?
  reservationGuests Int?
  closedReason      String?
  createdAt         DateTime @default(now())
  orders            Order[]
}

enum TableStatus {
  FREE
  OCCUPIED
  RESERVED
  CLOSED
}
```

### Product
```prisma
model Product {
  id         String      @id @default(cuid())
  name       String
  price      Float
  category   String
  createdAt  DateTime    @default(now())
  orderItems OrderItem[]
}
```

### Order
```prisma
model Order {
  id        String      @id @default(cuid())
  status    OrderStatus @default(OPEN)
  tableId   String
  userId    String
  createdAt DateTime    @default(now())
  table     Table       @relation(fields: [tableId], references: [id])
  user      User        @relation(fields: [userId], references: [id])
  items     OrderItem[]
}

enum OrderStatus {
  OPEN
  PAID
  CANCELLED
}
```

### OrderItem
```prisma
model OrderItem {
  id        String         @id @default(cuid())
  quantity  Int
  status    OrderItemStatus @default(PENDING)
  orderId   String
  productId String
  createdAt DateTime       @default(now())
  order     Order          @relation(fields: [orderId], references: [id])
  product   Product        @relation(fields: [productId], references: [id])
}

enum OrderItemStatus {
  PENDING
  PREPARING
  READY
  SERVED
}
```

## 🔐 Authentifizierung

### JWT Token Structure
```json
{
  "userId": "cuid",
  "name": "Benutzername",
  "role": "ADMIN|WAITER",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Middleware
- **Authentication**: Prüft JWT Token in Authorization Header
- **Authorization**: Rollen-basierte Zugriffskontrolle
- **Rate Limiting**: Schutz vor Brute-Force-Attacken

### Passwort-Sicherheit
- **bcryptjs**: Sichere Passwort-Hashes mit Salt
- **Mindestlänge**: 6 Zeichen (konfigurierbar)
- **Keine Klartext-Speicherung**: Nur Hashes in der Datenbank

## 🔧 Entwicklung

### Scripts
```bash
npm run dev          # Development Server mit Hot Reload
npm run build        # TypeScript Build für Production
npm run start        # Production Server starten
npm run db:generate  # Prisma Client generieren
npm run db:push      # Schema zu Database pushen
npm run db:seed      # Test-Daten laden
npm run db:studio    # Prisma Studio öffnen
npm run db:migrate   # Database Migration erstellen
```

### Development Workflow
```bash
# 1. Änderungen am Schema
# prisma/schema.prisma bearbeiten

# 2. Schema zu DB pushen
npx prisma db push

# 3. Client neu generieren
npx prisma generate

# 4. Test-Daten neu laden (optional)
npx prisma db seed

# 5. Server neu starten (automatisch mit nodemon)
```

### Debugging
```bash
# Prisma Studio für Database GUI
npx prisma studio

# Server Logs anzeigen
npm run dev

# Database zurücksetzen
rm prisma/dev.db
npx prisma db push
npx prisma db seed
```

### Code-Struktur
```
src/
├── controllers/        # Business Logic
│   ├── authController.ts
│   ├── userController.ts
│   ├── tableController.ts
│   ├── productController.ts
│   ├── orderController.ts
│   ├── orderItemController.ts
│   └── statisticsController.ts
├── routes/            # API Route Definitionen
│   ├── auth.ts
│   ├── users.ts
│   ├── tables.ts
│   ├── products.ts
│   ├── orders.ts
│   ├── orderItems.ts
│   └── statistics.ts
├── middleware/        # Express Middleware
│   ├── auth.ts       # JWT Authentifizierung
│   ├── errorHandler.ts
│   └── notFound.ts
├── types/            # TypeScript Definitionen
│   └── index.ts
├── utils/            # Helper Funktionen
│   ├── database.ts   # Prisma Client
│   └── jwt.ts        # JWT Utilities
└── server.ts         # Main Server File
```

## 🌐 Deployment

### Production Build
```bash
# TypeScript kompilieren
npm run build

# Production Dependencies installieren
npm ci --only=production

# Database für Production vorbereiten
npx prisma db push
npx prisma generate
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'orderman-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
```

### Docker Setup
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Environment Variables (Production)
```env
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET=your-super-secure-production-jwt-secret-minimum-32-characters
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

## 🐛 Troubleshooting

### Häufige Probleme

#### Database Connection Error
```bash
# Problem: Prisma kann nicht auf Database zugreifen
# Lösung: Schema neu pushen
npx prisma db push
npx prisma generate
```

#### JWT Secret Error
```bash
# Problem: JWT_SECRET zu kurz oder nicht gesetzt
# Lösung: Mindestens 32 Zeichen verwenden
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
```

#### Port bereits belegt
```bash
# Problem: Port 5000 bereits in Verwendung
# Lösung: Prozess beenden oder anderen Port verwenden
lsof -ti:5000 | xargs kill -9
# oder PORT=5001 in .env setzen
```

#### TypeScript Compile Errors
```bash
# Problem: TypeScript Fehler beim Build
# Lösung: Dependencies und Types aktualisieren
rm -rf node_modules package-lock.json
npm install
```

### Performance Tuning

#### Database Optimierung
```sql
-- Indizes für häufige Queries
CREATE INDEX idx_orders_table_id ON Order(tableId);
CREATE INDEX idx_orders_status ON Order(status);
CREATE INDEX idx_order_items_order_id ON OrderItem(orderId);
```

#### Memory Management
```javascript
// Prisma Connection Pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

### Monitoring
```bash
# Server Logs
tail -f logs/server.log

# PM2 Monitoring
pm2 monit

# Database Size
du -h prisma/dev.db
```

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional error details"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🔒 Security Features

- **JWT Authentication**: Sichere Token-basierte Authentifizierung
- **bcrypt**: Passwort-Hashing mit Salt
- **Helmet**: Security Headers setzen
- **CORS**: Cross-Origin Request Schutz
- **Rate Limiting**: Schutz vor Brute-Force-Attacken
- **Input Validation**: Validierung aller Eingaben
- **SQL Injection Protection**: Prisma ORM verhindert SQL Injection

---

**Backend entwickelt mit ⚡ Express.js und 💎 TypeScript** 