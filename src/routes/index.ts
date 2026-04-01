import { Router } from 'express';
import { userRoutes } from '../modules/users/routes/user.routes';
import authRoutes from '../modules/auth/routes/auth.routes';
import { studentRoutes } from '../modules/students';
import { facultyRoutes } from '../modules/faculty';
import { instructionRoutes } from '../modules/instructions';
import { 
  enrollmentRoutes,
  studentEnrollmentRoutes,
  instructionEnrollmentRoutes,
} from '../modules/enrollments';
import {
  academicHistoryRoutes,
  studentAcademicHistoryRoutes,
} from '../modules/academic-history';

export const routes = Router();

// API v1 routes
routes.use('/v1/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/v1/admin/students', studentRoutes);
routes.use('/v1/admin/students', studentEnrollmentRoutes);
routes.use('/v1/admin/students', studentAcademicHistoryRoutes);
routes.use('/v1/admin/faculty', facultyRoutes);
routes.use('/v1/admin/instructions', instructionRoutes);
routes.use('/v1/admin/instructions', instructionEnrollmentRoutes);
routes.use('/v1/admin/enrollments', enrollmentRoutes);
routes.use('/v1/admin/academic-history', academicHistoryRoutes);
