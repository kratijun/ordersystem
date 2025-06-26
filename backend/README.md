# Orderman Backend

Express.js Backend für das Orderman Restaurant Management System.

## 🚀 Features

- **Authentifizierung**: JWT-basierte Authentifizierung mit Rollen (Admin/Waiter)
- **Benutzerverwaltung**: CRUD-Operationen für Benutzer
- **Tischverwaltung**: Tische mit Reservierungen und Status
- **Produktverwaltung**: Kategorisierte Produkte mit Preisen
- **Bestellsystem**: Vollständiges Bestellmanagement
- **Küchenverwaltung**: Status-Tracking für Bestellartikel
- **Statistiken**: Detaillierte Auswertungen und CSV-Export
- **Sicherheit**: Rate Limiting, Helmet, CORS

## 🛠️ Tech Stack

- **Runtime**: Node.js mit TypeScript
- **Framework**: Express.js
- **Database**: SQLite mit Prisma ORM
- **Authentifizierung**: JWT (jsonwebtoken)
- **Sicherheit**: bcryptjs, helmet, cors, express-rate-limit
- **Entwicklung**: nodemon, ts-node

## 📦 Installation

1. **Dependencies installieren**:
   \`\`\`bash
   cd backend
   npm install
   \`\`\`

2. **Umgebungsvariablen konfigurieren**:
   \`\`\`bash
   # .env Datei erstellen
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="orderman-super-secret-jwt-key-2024"
   JWT_EXPIRES_IN="24h"
   JWT_REFRESH_SECRET="orderman-super-secret-refresh-key-2024"
   JWT_REFRESH_EXPIRES_IN="7d"
   PORT=5000
   NODE_ENV="development"
   FRONTEND_URL="http://localhost:3000"
   \`\`\`

3. **Datenbank einrichten**:
   \`\`\`bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   \`\`\`

4. **Entwicklungsserver starten**:
   \`\`\`bash
   npm run dev
   \`\`\`

## 🔧 Verfügbare Scripts

- \`npm run dev\` - Entwicklungsserver mit Hot Reload
- \`npm run build\` - TypeScript kompilieren
- \`npm start\` - Produktionsserver starten
- \`npm run db:generate\` - Prisma Client generieren
- \`npm run db:push\` - Datenbankschema pushen
- \`npm run db:migrate\` - Migration erstellen
- \`npm run db:seed\` - Testdaten einpflegen
- \`npm run db:studio\` - Prisma Studio öffnen

## 📡 API Endpoints

### Authentifizierung
- \`POST /api/auth/login\` - Benutzer anmelden
- \`POST /api/auth/register\` - Benutzer registrieren
- \`GET /api/auth/me\` - Aktueller Benutzer

### Benutzer
- \`GET /api/users\` - Alle Benutzer (Admin)
- \`POST /api/users\` - Benutzer erstellen (Admin)
- \`PUT /api/users/:id\` - Benutzer bearbeiten (Admin)
- \`DELETE /api/users/:id\` - Benutzer löschen (Admin)
- \`PUT /api/users/profile\` - Eigenes Profil bearbeiten

### Tische
- \`GET /api/tables\` - Alle Tische
- \`POST /api/tables\` - Tisch erstellen (Admin)
- \`PUT /api/tables/:id\` - Tisch bearbeiten
- \`DELETE /api/tables/:id\` - Tisch löschen (Admin)
- \`PUT /api/tables/:id/reserve\` - Tisch reservieren
- \`PUT /api/tables/:id/close\` - Tisch schließen

### Produkte
- \`GET /api/products\` - Alle Produkte
- \`GET /api/products/categories\` - Alle Kategorien
- \`POST /api/products\` - Produkt erstellen (Admin)
- \`PUT /api/products/:id\` - Produkt bearbeiten (Admin)
- \`DELETE /api/products/:id\` - Produkt löschen (Admin)

### Bestellungen
- \`GET /api/orders\` - Alle Bestellungen
- \`GET /api/orders/:id\` - Bestellung Details
- \`POST /api/orders\` - Bestellung erstellen
- \`PUT /api/orders/:id\` - Bestellung bearbeiten
- \`DELETE /api/orders/:id\` - Bestellung löschen (Admin)
- \`POST /api/orders/:id/items\` - Artikel hinzufügen

### Bestellartikel
- \`GET /api/order-items\` - Alle Bestellartikel
- \`GET /api/order-items/kitchen\` - Küchen-Artikel
- \`PUT /api/order-items/:id\` - Artikel bearbeiten
- \`PUT /api/order-items/:id/start-preparation\` - Zubereitung starten
- \`PUT /api/order-items/:id/mark-ready\` - Als fertig markieren
- \`DELETE /api/order-items/:id\` - Artikel löschen (Admin)

### Statistiken
- \`GET /api/statistics\` - Statistiken abrufen
- \`GET /api/statistics/export\` - CSV Export (Admin)

## 🔐 Authentifizierung

Das Backend verwendet JWT-Token für die Authentifizierung. Token müssen im Authorization Header gesendet werden:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## 👥 Standardbenutzer

Nach dem Seeding sind folgende Benutzer verfügbar:
- **Admin**: \`admin\` / \`123456\`
- **Kellner**: \`kellner\` / \`123456\`

## 🗄️ Datenbank

Das Backend verwendet SQLite mit Prisma ORM. Die Datenbank wird automatisch erstellt und mit Testdaten gefüllt.

## 🚀 Deployment

Für die Produktion:

1. **Environment Variables setzen**:
   \`\`\`bash
   NODE_ENV=production
   JWT_SECRET=<sicherer-production-key>
   DATABASE_URL=<production-database-url>
   \`\`\`

2. **Build erstellen**:
   \`\`\`bash
   npm run build
   \`\`\`

3. **Produktionsserver starten**:
   \`\`\`bash
   npm start
   \`\`\`

## 📊 Health Check

Das Backend bietet einen Health Check Endpoint:
\`GET /health\` - Status des Servers

## 🔒 Sicherheit

- Rate Limiting (100 Requests/15min)
- Helmet für Security Headers
- CORS konfiguriert
- Passwort-Hashing mit bcrypt
- JWT Token Expiration
- Input Validation

## 📝 Lizenz

MIT License 