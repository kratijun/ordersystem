import { Router } from 'express';
import { 
  getOrders, 
  getOrder,
  createOrder, 
  updateOrder, 
  deleteOrder,
  addItemsToOrder
} from '@/controllers/orderController';
import { authenticateToken, requireAdmin } from '@/middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// Allgemeine Routen (für alle authentifizierten Benutzer)
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.post('/:id/items', addItemsToOrder);

// Admin-Routen (nur für Administratoren)
router.delete('/:id', requireAdmin, deleteOrder);

export default router; 