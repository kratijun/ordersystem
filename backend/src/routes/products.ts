import { Router } from 'express';
import { 
  getProducts, 
  getProductCategories,
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '@/controllers/productController';
import { authenticateToken, requireAdmin } from '@/middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// Allgemeine Routen (für alle authentifizierten Benutzer)
router.get('/', getProducts);
router.get('/categories', getProductCategories);

// Admin-Routen (nur für Administratoren)
router.post('/', requireAdmin, createProduct);
router.put('/:id', requireAdmin, updateProduct);
router.delete('/:id', requireAdmin, deleteProduct);

export default router; 