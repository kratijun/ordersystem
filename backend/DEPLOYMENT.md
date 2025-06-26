# 🚀 VServer Deployment Guide

Anleitung zum Deployment des Orderman Backends auf einem VServer.

## 📋 Voraussetzungen

- Ubuntu/Debian VServer mit Root-Zugang
- Domain oder IP-Adresse
- Mindestens 1GB RAM, 10GB Storage

## 🛠️ Server Setup

### 1. Server Updates

```bash
# System updaten
sudo apt update && sudo apt upgrade -y

# Grundlegende Tools installieren
sudo apt install -y curl wget git unzip nginx certbot python3-certbot-nginx
```

### 2. Node.js installieren

```bash
# NodeSource Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js installieren
sudo apt install -y nodejs

# Versionen prüfen
node --version
npm --version
```

### 3. PM2 Process Manager installieren

```bash
# PM2 global installieren
sudo npm install -g pm2

# PM2 Startup konfigurieren
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## 📦 Backend Deployment

### 1. Repository klonen

```bash
# Ordner erstellen
sudo mkdir -p /var/www/orderman
sudo chown $USER:$USER /var/www/orderman

# Repository klonen
cd /var/www/orderman
git clone <your-repo-url> .

# Zum Backend-Ordner wechseln
cd backend
```

### 2. Dependencies installieren

```bash
# Production Dependencies installieren
npm ci --only=production

# TypeScript global installieren (für Build)
sudo npm install -g typescript

# Build erstellen
npm run build
```

### 3. Umgebungsvariablen konfigurieren

```bash
# .env Datei erstellen
nano .env
```

Inhalt der `.env` Datei:

```env
# Database (SQLite für VServer)
DATABASE_URL="file:/var/www/orderman/backend/production.db"

# JWT (WICHTIG: Sichere Keys generieren!)
JWT_SECRET="IHR-SUPER-SICHERER-JWT-KEY-HIER"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_SECRET="IHR-SUPER-SICHERER-REFRESH-KEY-HIER"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="production"

# CORS (Ihre Domain eintragen)
FRONTEND_URL="https://ihre-domain.de"
```

### 4. Datenbank einrichten

```bash
# Prisma Client generieren
npx prisma generate

# Datenbank Schema erstellen
npx prisma db push

# Testdaten einpflegen (optional)
npm run db:seed
```

### 5. PM2 Konfiguration

```bash
# ecosystem.config.js erstellen
nano ecosystem.config.js
```

Inhalt:

```javascript
module.exports = {
  apps: [{
    name: 'orderman-backend',
    script: 'dist/server.js',
    cwd: '/var/www/orderman/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: '/var/log/orderman/combined.log',
    out_file: '/var/log/orderman/out.log',
    error_file: '/var/log/orderman/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

### 6. Log-Ordner erstellen

```bash
# Log-Ordner erstellen
sudo mkdir -p /var/log/orderman
sudo chown $USER:$USER /var/log/orderman
```

### 7. Backend starten

```bash
# Mit PM2 starten
pm2 start ecosystem.config.js

# PM2 Config speichern
pm2 save

# Status prüfen
pm2 status
pm2 logs orderman-backend
```

## 🌐 Nginx Reverse Proxy

### 1. Nginx Konfiguration

```bash
# Site-Konfiguration erstellen
sudo nano /etc/nginx/sites-available/orderman-backend
```

Inhalt:

```nginx
server {
    listen 80;
    server_name api.ihre-domain.de; # Ihre API-Domain

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health Check
    location /health {
        access_log off;
        proxy_pass http://localhost:5000/health;
    }
}
```

### 2. Site aktivieren

```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/orderman-backend /etc/nginx/sites-enabled/

# Nginx Konfiguration testen
sudo nginx -t

# Nginx neustarten
sudo systemctl restart nginx
```

## 🔒 SSL Zertifikat (Let's Encrypt)

```bash
# SSL Zertifikat erstellen
sudo certbot --nginx -d api.ihre-domain.de

# Auto-Renewal testen
sudo certbot renew --dry-run
```

## 🔧 Firewall Konfiguration

```bash
# UFW aktivieren
sudo ufw enable

# Notwendige Ports öffnen
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Status prüfen
sudo ufw status
```

## 📊 Monitoring & Logs

### 1. PM2 Monitoring

```bash
# Realtime Monitoring
pm2 monit

# Logs anzeigen
pm2 logs orderman-backend

# App neustarten
pm2 restart orderman-backend

# App stoppen
pm2 stop orderman-backend
```

### 2. System Logs

```bash
# Nginx Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System Logs
sudo journalctl -u nginx -f
```

## 🔄 Updates & Maintenance

### 1. Code Updates

```bash
# Zum Backend-Ordner
cd /var/www/orderman/backend

# Code pullen
git pull origin main

# Dependencies updaten
npm ci --only=production

# Neu builden
npm run build

# App neustarten
pm2 restart orderman-backend
```

### 2. Datenbank Backup

```bash
# Backup-Script erstellen
nano /var/www/orderman/backup.sh
```

Inhalt:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/orderman"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup-Ordner erstellen
mkdir -p $BACKUP_DIR

# Datenbank kopieren
cp /var/www/orderman/backend/production.db $BACKUP_DIR/db_backup_$DATE.db

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "db_backup_*.db" -mtime +30 -delete

echo "Backup erstellt: db_backup_$DATE.db"
```

```bash
# Executable machen
chmod +x /var/www/orderman/backup.sh

# Cronjob für tägliches Backup
crontab -e
# Hinzufügen: 0 2 * * * /var/www/orderman/backup.sh
```

## 🚨 Troubleshooting

### 1. Backend läuft nicht

```bash
# PM2 Status prüfen
pm2 status

# Logs prüfen
pm2 logs orderman-backend

# App neustarten
pm2 restart orderman-backend
```

### 2. Nginx Fehler

```bash
# Nginx Status
sudo systemctl status nginx

# Konfiguration testen
sudo nginx -t

# Nginx neustarten
sudo systemctl restart nginx
```

### 3. Datenbankprobleme

```bash
# Datenbank-Pfad prüfen
ls -la /var/www/orderman/backend/production.db

# Berechtigungen setzen
chown $USER:$USER /var/www/orderman/backend/production.db
```

### 4. Port bereits in Verwendung

```bash
# Port-Verwendung prüfen
sudo netstat -tulpn | grep :5000

# Prozess beenden
sudo kill -9 <PID>
```

## 📈 Performance Optimierung

### 1. PM2 Cluster Mode

```javascript
// ecosystem.config.js anpassen
module.exports = {
  apps: [{
    name: 'orderman-backend',
    script: 'dist/server.js',
    instances: 'max', // Nutzt alle CPU-Kerne
    exec_mode: 'cluster',
    // ... rest der Konfiguration
  }]
};
```

### 2. Nginx Caching

```nginx
# In der Nginx-Konfiguration hinzufügen
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔐 Sicherheit

### 1. Fail2Ban installieren

```bash
sudo apt install fail2ban

# Konfiguration für Nginx
sudo nano /etc/fail2ban/jail.local
```

### 2. Automatische Updates

```bash
# Unattended Upgrades installieren
sudo apt install unattended-upgrades

# Konfigurieren
sudo dpkg-reconfigure unattended-upgrades
```

## 📞 Support

Bei Problemen:
1. Logs prüfen: `pm2 logs orderman-backend`
2. Health Check: `curl http://localhost:5000/health`
3. Nginx Status: `sudo systemctl status nginx`
4. System Resources: `htop` oder `top`

## ✅ Deployment Checklist

- [ ] Server Setup abgeschlossen
- [ ] Node.js & PM2 installiert
- [ ] Repository geklont
- [ ] Dependencies installiert
- [ ] .env Datei konfiguriert
- [ ] Datenbank eingerichtet
- [ ] PM2 App läuft
- [ ] Nginx konfiguriert
- [ ] SSL Zertifikat installiert
- [ ] Firewall konfiguriert
- [ ] Backup-Script eingerichtet
- [ ] Monitoring funktioniert

🎉 **Backend erfolgreich deployed!** 