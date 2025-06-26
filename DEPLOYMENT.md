# Deployment auf Vercel

## Vorbereitung

### 1. Umgebungsvariablen in Vercel setzen

Gehen Sie zu Ihrem Vercel Dashboard → Projekt → Settings → Environment Variables und fügen Sie folgende Variablen hinzu:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="ein-sicherer-geheimer-schluessel-hier"
NEXTAUTH_URL="https://ihr-projekt-name.vercel.app"
```

**Wichtig für Produktion:** 
- Verwenden Sie eine Cloud-Datenbank (PostgreSQL, MySQL) statt SQLite
- Beispiel für PostgreSQL: `DATABASE_URL="postgresql://user:password@host:port/database"`

### 2. Lokale Entwicklung

Erstellen Sie eine `.env.local` Datei im Projektverzeichnis:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="ihr-lokaler-geheimer-schluessel"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Datenbank-Setup für Cloud-Deployment

Für Vercel empfohlen:
- **Neon** (PostgreSQL): https://neon.tech/
- **PlanetScale** (MySQL): https://planetscale.com/
- **Supabase** (PostgreSQL): https://supabase.com/

#### Beispiel für PostgreSQL (Neon/Supabase):

1. Prisma Schema anpassen:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Dependencies aktualisieren:
```bash
npm install pg @types/pg
npm uninstall @types/better-sqlite3
```

3. Migration erstellen:
```bash
npx prisma migrate dev --name init
```

## Deployment-Schritte

1. Repository zu GitHub pushen
2. Vercel mit GitHub Repository verbinden
3. Umgebungsvariablen in Vercel setzen
4. Deploy!

## Troubleshooting

### Prisma Client Fehler
Falls "Prisma Client not generated" Fehler auftreten:
- `postinstall` Script ist bereits konfiguriert
- Build-Command ist bereits angepasst

### SQLite auf Vercel
SQLite funktioniert nicht auf Vercel (serverless). Verwenden Sie eine Cloud-Datenbank.

### Session-Probleme
Stellen Sie sicher, dass `NEXTAUTH_URL` korrekt auf Ihre Vercel-Domain zeigt. 