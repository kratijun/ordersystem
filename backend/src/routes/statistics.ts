import { Router } from 'express';
import { getStatistics, exportStatistics } from '@/controllers/statisticsController';
import { authenticateToken, requireAdmin } from '@/middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// Statistiken anzeigen (für alle authentifizierten Benutzer)
router.get('/', getStatistics);

// Export (nur für Administratoren)
router.get('/export', requireAdmin, exportStatistics);

export default router; 