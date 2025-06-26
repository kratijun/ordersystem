import { Router } from 'express';
import { login, register, me } from '@/controllers/authController';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

// Öffentliche Routen
router.post('/login', login);
router.post('/register', register);

// Geschützte Routen
router.get('/me', authenticateToken, me);

export default router; 