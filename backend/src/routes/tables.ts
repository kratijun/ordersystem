import { Router } from 'express';
import { 
  getTables, 
  createTable, 
  updateTable, 
  deleteTable, 
  reserveTable, 
  closeTable 
} from '@/controllers/tableController';
import { authenticateToken, requireAdmin } from '@/middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// Allgemeine Routen (für alle authentifizierten Benutzer)
router.get('/', getTables);

// Reservierung und Schließung (für alle authentifizierten Benutzer)
router.put('/:id/reserve', reserveTable);
router.put('/:id/close', closeTable);

// Admin-Routen (nur für Administratoren)
router.post('/', requireAdmin, createTable);
router.put('/:id', updateTable); // Alle können Tische aktualisieren
router.delete('/:id', requireAdmin, deleteTable);

export default router; 