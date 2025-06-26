import { Router } from 'express';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  updateProfile 
} from '@/controllers/userController';
import { authenticateToken, requireAdmin } from '@/middleware/auth';

const router = Router();

// Alle Routen erfordern Authentifizierung
router.use(authenticateToken);

// Profile-Routen (für alle authentifizierten Benutzer)
router.put('/profile', updateProfile);

// Admin-Routen (nur für Administratoren)
router.get('/', requireAdmin, getUsers);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);

export default router; 