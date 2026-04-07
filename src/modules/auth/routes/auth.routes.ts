import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { UserRepository } from '../../users/repositories/user.repository';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { authRateLimiter } from '../../../shared/middleware/rateLimiter';
import { db } from '../../../db';

const router = Router();

// Initialize repository and controller
const userRepository = new UserRepository(db);
const authController = new AuthController(userRepository);

// Public routes with rate limiting
router.post('/login', authRateLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authRateLimiter, authController.refresh);

// Protected routes (require authentication)
router.get('/me', authMiddleware, authController.me);
router.post('/change-password', authMiddleware, authController.changePassword);

export default router;
