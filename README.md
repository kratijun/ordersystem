# 🍽️ Orderman System - Restaurant Bestellsystem

Ein vollständiges Restaurant-Bestellsystem mit separatem Frontend (Next.js) und Backend (Express.js). Ermöglicht Kellnern die Verwaltung von Tischbestellungen und Administratoren die Verwaltung von Benutzern, Produkten und Statistiken.

**🌐 Automatische Domain-Erkennung**: Das System konfiguriert sich automatisch für jede Domain, auf der es installiert wird!

## 📋 Inhaltsverzeichnis

- [Features](#features)
- [Technologie-Stack](#technologie-stack)
- [Architektur](#architektur)
- [Installation](#installation)
- [Verwendung](#verwendung)
- [API-Dokumentation](#api-dokumentation)
- [Projektstruktur](#projektstruktur)
- [Entwicklung](#entwicklung)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### 🔐 Authentifizierung
- **Admin-Login**: Vollzugriff auf alle Funktionen
- **Kellner-Login**: Tischverwaltung und Bestellungen
- **JWT-basierte Authentifizierung**: Sichere Token-basierte Anmeldung

### 📊 Dashboard-Funktionen

#### 👑 Admin Dashboard
- **Produktverwaltung**: Hinzufügen, Bearbeiten, Löschen von Speisen und Getränken
- **Benutzerverwaltung**: Kellner und Admin-Accounts verwalten
- **Tischverwaltung**: Tische erstellen, bearbeiten und verwalten
- **Statistiken**: Umsatzanalyse, Top-Produkte, Kategorien-Auswertung
- **Export-Funktionen**: CSV und PDF Export für Berichte

#### 👨‍💼 Kellner Dashboard
- **Tischübersicht**: Status aller Tische (Frei, Belegt, Reserviert, Geschlossen)
- **Bestellungsaufnahme**: Intuitive Produktauswahl mit Kategorien und Suche
- **Reservierungsverwaltung**: Tische reservieren mit Gast-Informationen
- **Bestellungsverwaltung**: Bestehende Bestellungen verwalten und erweitern

#### 🍳 Küchen-Ansicht
- **Eingehende Bestellungen**: Nach Tisch organisiert
- **Artikel-Status**: Zubereitung verfolgen und als fertig markieren
- **Zeitbasierte Priorisierung**: Älteste Bestellungen zuerst

### 📱 Responsive Design
- **Mobile-First**: Optimiert für Tablets und Smartphones
- **Touch-freundlich**: Große Buttons und intuitive Bedienung
- **Modern UI**: shadcn/ui Komponenten mit Tailwind CSS

## 🛠️ Technologie-Stack

### Frontend
- **Framework**: Next.js 14 mit App Router
- **Sprache**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context (Authentication)
- **Icons**: Lucide React

### Backend
- **Framework**: Express.js mit TypeScript
- **Database**: SQLite mit Prisma ORM
- **Authentication**: JWT mit bcryptjs
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

### Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Hot Reload**: Nodemon (Backend), Next.js (Frontend)

## 🏗️ Architektur

```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐
│   Frontend      │ ◄─────────────► │    Backend      │
│   (Next.js)     │     REST API    │   (Express.js)  │
│   Port: 3000    │                 │   Port: 5000    │
└─────────────────┘                 └─────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │    Database     │
                                    │    (SQLite)     │
                                    │   + Prisma ORM  │
                                    └─────────────────┘
```

### Frontend (Port 3000)
- **Framework**: Next.js 14 mit TypeScript
- **Styling**: Tailwind CSS + shadcn/ui Komponenten
- **Authentication**: Eigenes JWT-basiertes System
- **API Client**: Zentrale API-Funktionen in `lib/api.ts`

### Backend (Port 5000)
- **Framework**: Express.js mit TypeScript
- **Database**: SQLite mit Prisma ORM
- **Security**: JWT, bcrypt, Helmet, CORS, Rate Limiting
- **Structure**: Controller/Route/Middleware Pattern

## 🚀 Installation

### Voraussetzungen
- **Node.js**: Version 18 oder höher
- **npm**: Version 8 oder höher
- **Git**: Für Repository-Verwaltung

### 1. Repository klonen
```bash
git clone <repository-url>
cd ordersystem
```

### 2. Frontend Setup
```bash
# Dependencies installieren
npm install

# Environment-Datei erstellen
cp .env.example .env.local
```

### 3. Backend Setup
```bash
# In Backend-Verzeichnis wechseln
cd backend

# Dependencies installieren
npm install

# Environment-Datei erstellen
cp .env.example .env

# Datenbank initialisieren
npx prisma db push
npx prisma db seed
```

### 4. Environment-Variablen konfigurieren

#### Frontend (.env.local)
```env
# Für Development
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Für Production (optional - wird automatisch erkannt)
# NEXT_PUBLIC_API_URL=  # Leer lassen für automatische Domain-Erkennung
# NEXT_PUBLIC_API_URL=https://your-domain.com/api  # Oder explizit setzen
```

#### Backend (.env)
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
PORT=5000
NODE_ENV=development

# Optional: Explizite Frontend URL setzen
# FRONTEND_URL=https://your-domain.com
```

## 🎯 Verwendung

### 1. Backend starten
```bash
cd backend
npm run dev
```
Server läuft auf: `http://localhost:5000`

### 2. Frontend starten
```bash
# Im Hauptverzeichnis
npm run dev
```
App läuft auf: `http://localhost:3000`

### 3. Test-Zugänge

Nach dem Database-Seeding stehen folgende Test-Benutzer zur Verfügung:

| Rolle | Benutzername | Passwort | Berechtigung |
|-------|--------------|----------|--------------|
| Admin | `admin` | `123456` | Vollzugriff |
| Kellner | `kellner` | `123456` | Tisch- & Bestellverwaltung |

### 4. Erste Schritte

1. **Login**: Gehe zu `http://localhost:3000/login`
2. **Admin-Bereich**: Mit Admin-Account anmelden → Dashboard erkunden
3. **Kellner-Bereich**: Mit Kellner-Account anmelden → Tischübersicht verwenden
4. **Küche**: Direkt `http://localhost:3000/kitchen` aufrufen (keine Anmeldung)

## 📚 API-Dokumentation

### Authentication
- `POST /api/auth/login` - Benutzer-Login
- `POST /api/auth/register` - Benutzer-Registrierung
- `GET /api/auth/me` - Aktueller Benutzer

### Users (Admin only)
- `GET /api/users` - Alle Benutzer
- `POST /api/users` - Benutzer erstellen
- `PUT /api/users/:id` - Benutzer aktualisieren
- `DELETE /api/users/:id` - Benutzer löschen

### Tables
- `GET /api/tables` - Alle Tische
- `GET /api/tables/:id` - Tisch Details
- `POST /api/tables` - Tisch erstellen (Admin)
- `PUT /api/tables/:id` - Tisch aktualisieren

### Products (Admin only)
- `GET /api/products` - Alle Produkte
- `POST /api/products` - Produkt erstellen
- `PUT /api/products/:id` - Produkt aktualisieren
- `DELETE /api/products/:id` - Produkt löschen

### Orders
- `GET /api/orders` - Alle Bestellungen
- `GET /api/orders/:id` - Bestellung Details
- `POST /api/orders` - Bestellung erstellen
- `PUT /api/orders/:id` - Bestellung aktualisieren

### Order Items
- `PUT /api/order-items/:id` - Artikel Status aktualisieren

## 📁 Projektstruktur

```
ordersystem/
├── app/                        # Next.js App Router
│   ├── admin/                  # Admin Dashboard
│   │   ├── kitchen/           # Küchen-Ansicht
│   │   ├── orders/            # Bestellverwaltung
│   │   ├── products/          # Produktverwaltung
│   │   ├── statistics/        # Statistiken
│   │   ├── tables/            # Tischverwaltung
│   │   └── users/             # Benutzerverwaltung
│   ├── login/                 # Login-Seite
│   ├── waiter/                # Kellner Dashboard
│   └── kitchen/               # Küchen-Ansicht
├── backend/                   # Express.js Backend
│   ├── src/
│   │   ├── controllers/       # Business Logic
│   │   ├── routes/            # API Routes
│   │   ├── middleware/        # Auth, Error Handling
│   │   ├── types/             # TypeScript Types
│   │   └── utils/             # Database, JWT Utils
│   └── prisma/                # Database Schema & Seeds
├── components/                # React Komponenten
│   ├── auth-provider.tsx      # Authentication Context
│   ├── protected-route.tsx    # Route Protection
│   └── ui/                    # shadcn/ui Komponenten
├── lib/                       # Utilities
│   ├── api.ts                 # API Client Funktionen
│   └── utils.ts               # Helper Funktionen
└── types/                     # TypeScript Definitions
```

## 🔧 Entwicklung

### Frontend Development
```bash
npm run dev          # Development Server
npm run build        # Production Build
npm run start        # Production Server
npm run lint         # ESLint Check
```

### Backend Development
```bash
cd backend
npm run dev          # Development Server mit Nodemon
npm run build        # TypeScript Build
npm run start        # Production Server
```

### Database Management
```bash
cd backend
npx prisma studio           # Database GUI
npx prisma db push          # Schema zu DB
npx prisma db seed          # Test-Daten laden
npx prisma generate         # Client generieren
```

### Database Reset
```bash
cd backend
rm prisma/dev.db           # Datenbank löschen
npx prisma db push         # Schema neu erstellen
npx prisma db seed         # Test-Daten neu laden
```

## 🌐 Deployment

### VServer Deployment

#### 1. Server Vorbereitung
```bash
# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 installieren
sudo npm install -g pm2

# Nginx installieren
sudo apt update
sudo apt install nginx
```

#### 2. Projekt deployen
```bash
# Repository klonen
git clone <repository-url>
cd ordersystem

# Frontend Build
npm install
npm run build

# Backend Setup
cd backend
npm install
npm run build
npx prisma db push
npx prisma db seed
```

#### 3. PM2 Konfiguration
```bash
# Backend starten
cd backend
pm2 start dist/server.js --name "orderman-backend"

# Frontend starten
cd ..
pm2 start npm --name "orderman-frontend" -- start

# PM2 speichern
pm2 save
pm2 startup
```

#### 4. Nginx Konfiguration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Variables (Production)

#### Automatische Konfiguration (Empfohlen)
```env
# Frontend - Keine API URL nötig, wird automatisch erkannt
# .env.local kann leer bleiben oder nur Development-Werte enthalten

# Backend
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET=your-super-secret-production-jwt-key
PORT=5000
NODE_ENV=production
# FRONTEND_URL wird automatisch erkannt
```

#### Explizite Konfiguration (Optional)
```env
# Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Backend
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET=your-super-secret-production-jwt-key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

## 🌐 Automatische Domain-Konfiguration

### 🔧 Wie es funktioniert

Das System erkennt automatisch die Domain, auf der es läuft:

#### Development
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000`
- **API Calls**: Direkt zu localhost:5000

#### Production
- **Automatische Erkennung**: Das Frontend erkennt die aktuelle Domain
- **Relative API URLs**: `/api` statt absolute URLs
- **CORS**: Automatische Freigabe für HTTPS-Domains
- **Flexible Konfiguration**: Explizite URLs optional möglich

### 📋 Deployment auf beliebiger Domain

1. **Einfaches Deployment**:
   ```bash
   # Keine Domain-spezifische Konfiguration nötig!
   npm run build
   ```

2. **Automatische Konfiguration**:
   - Frontend erkennt aktuelle Domain automatisch
   - Backend erlaubt alle HTTPS-Domains
   - API-Calls funktionieren relativ zur Domain

3. **Optionale explizite Konfiguration**:
   ```env
   # Frontend
   NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
   
   # Backend
   FRONTEND_URL=https://your-domain.com
   ```

### 🚀 Multi-Domain Support

Das System unterstützt:
- **Entwicklung**: localhost:3000 ↔ localhost:5000
- **Staging**: staging.your-domain.com
- **Production**: your-domain.com
- **Custom Domains**: any-domain.com
- **Subdomains**: app.your-domain.com

## 🐛 Troubleshooting

### Häufige Probleme

#### NextAuth Fehler
**Problem**: NextAuth-Importe oder Session-Fehler
**Lösung**: Eigenes JWT-System verwenden - `useAuth` Hook statt `useSession`

#### API Fehler
**Problem**: Direkte fetch-Calls funktionieren nicht
**Lösung**: `lib/api.ts` Funktionen verwenden für konsistente API-Calls

#### Database Fehler
**Problem**: Prisma Schema Änderungen werden nicht übernommen
**Lösung**: 
```bash
cd backend
npx prisma db push
npx prisma generate
```

#### Port-Konflikte
**Problem**: Port 3000 oder 5000 bereits belegt
**Lösung**:
```bash
# Prozesse finden und beenden
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

#### TypeScript Fehler
**Problem**: Type-Fehler oder Module nicht gefunden
**Lösung**:
```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install

# TypeScript Cache löschen
rm -rf .next
```

### Debug-Tipps

#### Frontend Debugging
- Browser DevTools Console
- React Developer Tools
- Network Tab für API-Calls
- `console.log` in Komponenten

#### Backend Debugging
- Server Logs im Terminal
- Prisma Studio für Database: `npx prisma studio`
- Postman für API-Tests
- `console.log` in Controllern

### Performance Optimierung

#### Frontend
- Next.js Image Optimization nutzen
- Lazy Loading für große Listen
- React.memo für Performance-kritische Komponenten

#### Backend
- Database Indizes für häufige Queries
- Caching für statische Daten
- Connection Pooling für Production

## 📄 Lizenz

Dieses Projekt ist für Demonstrationszwecke erstellt.

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📞 Support

Bei Fragen oder Problemen:
1. Prüfe die [Troubleshooting](#troubleshooting) Sektion
2. Durchsuche die Issues im Repository
3. Erstelle ein neues Issue mit detaillierter Beschreibung

---

**Entwickelt mit ❤️ für die Gastronomie** 