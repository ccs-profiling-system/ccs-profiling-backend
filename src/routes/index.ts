import { Router } from 'express';
import { userRoutes } from '../modules/users/routes/user.routes';
import authRoutes from '../modules/auth/routes/auth.routes';

export const routes = Router();

// API v1 routes
routes.use('/v1/auth', authRoutes);
routes.use('/users', userRoutes);
