import { Router } from 'express';
import { 
  getOrderItems, 
  updateOrderItem, 
  deleteOrderItem,
  getKitchenItems,
  startPreparation,
  markReady
} from '@/controllers/orderItemController';
import { authenticateToken, requireAdmin } from '@/middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// Allgemeine Routen (für alle authentifizierten Benutzer)
router.get('/', getOrderItems);
router.get('/kitchen', getKitchenItems);
router.put('/:id', updateOrderItem);
router.put('/:id/start-preparation', startPreparation);
router.put('/:id/mark-ready', markReady);

// Admin-Routen (nur für Administratoren)
router.delete('/:id', requireAdmin, deleteOrderItem);

export default router; 