import { Router } from 'express';
import { userRoutes } from '../modules/users/routes/user.routes';
import authRoutes from '../modules/auth/routes/auth.routes';
import { studentRoutes } from '../modules/students';
import { facultyRoutes } from '../modules/faculty';
import { instructionRoutes } from '../modules/instructions';

export const routes = Router();

// API v1 routes
routes.use('/v1/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/v1/admin/students', studentRoutes);
routes.use('/v1/admin/faculty', facultyRoutes);
routes.use('/v1/admin/instructions', instructionRoutes);
