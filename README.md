# Orderman System

Ein vollständiges Restaurant-Bestellsystem gebaut mit Next.js, Prisma, SQLite und shadcn/ui.

## Features

### Authentifizierung
- Admin Login (Benutzerverwaltung, Produktverwaltung, Statistiken)
- Kellner Login (Tischverwaltung, Bestellungen)

### Datenbankmodelle
- **User**: Benutzer mit Rollen (Admin, Kellner)
- **Table**: Tische mit Status (Frei, Besetzt, Geschlossen)
- **Product**: Produkte mit Kategorien und Preisen
- **Order**: Bestellungen mit Status
- **OrderItem**: Bestellpositionen mit Status

### Funktionalitäten

#### Admin Dashboard
- Produktverwaltung (Hinzufügen, Bearbeiten, Löschen)
- Bestellungsübersicht und Statistiken
- Umsatzanzeige

#### Kellner Dashboard
- Tischübersicht mit Status-Anzeige
- Neue Bestellungen erstellen
- Bestehende Bestellungen verwalten
- Artikel zu Bestellungen hinzufügen
- Bestellungen als bezahlt markieren

#### Küchen-Ansicht
- Eingehende Bestellpositionen nach Tisch
- Artikel als zubereitet markieren
- Zeitbasierte Priorisierung

## Installation

### Voraussetzungen
- Node.js 18+ 
- npm oder yarn

### Setup

1. **Repository klonen**
```bash
git clone <repository-url>
cd ordersystem
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Umgebungsvariablen konfigurieren**
Erstellen Sie eine `.env.local` Datei:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
DATABASE_URL="file:./prisma/dev.db"
```

4. **Datenbank initialisieren**
```bash
npx prisma db push
npx prisma db seed
```

5. **Entwicklungsserver starten**
```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` erreichbar.

## Test-Zugänge

Nach dem Seeding stehen folgende Test-Benutzer zur Verfügung:

- **Admin**: 
  - Benutzername: `Admin`
  - Passwort: `admin123`

- **Kellner**: 
  - Benutzername: `Kellner Max`
  - Passwort: `waiter123`

## Verwendung

### Admin-Funktionen
1. Mit Admin-Zugangsdaten anmelden
2. Produkte verwalten über das Dashboard
3. Bestellungsstatistiken einsehen
4. Umsätze verfolgen

### Kellner-Funktionen
1. Mit Kellner-Zugangsdaten anmelden
2. Tischübersicht anzeigen
3. Auf freien Tisch klicken → Neue Bestellung erstellen
4. Auf besetzten Tisch klicken → Bestellung verwalten
5. Artikel hinzufügen oder stornieren
6. Bestellung als bezahlt markieren

### Küche
1. Direkt `/kitchen` aufrufen (keine Anmeldung erforderlich)
2. Eingehende Bestellungen nach Tisch anzeigen
3. Artikel als zubereitet markieren

## Technologie-Stack

- **Frontend**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Datenbank**: SQLite
- **ORM**: Prisma
- **Authentifizierung**: NextAuth.js
- **Icons**: Lucide React

## Projektstruktur

```
ordersystem/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin Dashboard
│   ├── waiter/            # Kellner Dashboard
│   ├── kitchen/           # Küchen-Ansicht
│   ├── login/             # Login-Seite
│   └── api/               # API Routes
├── components/            # React Komponenten
│   └── ui/               # shadcn/ui Komponenten
├── lib/                  # Utilities
├── prisma/               # Datenbankschema und Seeds
└── types/                # TypeScript Typen
```

## API Endpoints

- `GET/POST /api/products` - Produktverwaltung
- `PUT/DELETE /api/products/[id]` - Einzelprodukt bearbeiten/löschen
- `GET /api/tables` - Tischübersicht
- `PATCH /api/tables/[id]` - Tischstatus ändern
- `GET/POST /api/orders` - Bestellungen
- `PATCH /api/orders/[id]` - Bestellung aktualisieren
- `PATCH /api/order-items/[id]` - Bestellposition aktualisieren

## Entwicklung

### Datenbank zurücksetzen
```bash
rm prisma/dev.db
npx prisma db push
npx prisma db seed
```

### Prisma Studio öffnen
```bash
npx prisma studio
```

### Build für Produktion
```bash
npm run build
npm start
```

## Lizenz

Dieses Projekt ist für Demonstrationszwecke erstellt. 