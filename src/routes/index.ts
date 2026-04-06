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
import { scheduleRoutes } from '../modules/scheduling';
import {
  skillRoutes,
  studentSkillRoutes,
} from '../modules/skills';
import {
  violationRoutes,
  studentViolationRoutes,
} from '../modules/violations';
import {
  affiliationRoutes,
  studentAffiliationRoutes,
} from '../modules/affiliations';
import { eventRoutes } from '../modules/events';
import { researchRoutes } from '../modules/research';
import { uploadRoutes } from '../modules/uploads';
import { auditLogRoutes } from '../modules/audit-logs';
import { dashboardRoutes } from '../modules/dashboard';
import { analyticsRoutes } from '../modules/analytics';
import { reportRoutes } from '../modules/reports';
import { searchRoutes } from '../modules/search';

export const routes = Router();

// API v1 routes
routes.use('/v1/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/v1/admin/students', studentRoutes);
routes.use('/v1/admin/students', studentEnrollmentRoutes);
routes.use('/v1/admin/students', studentAcademicHistoryRoutes);
routes.use('/v1/admin/students', studentSkillRoutes);
routes.use('/v1/admin/students', studentViolationRoutes);
routes.use('/v1/admin/students', studentAffiliationRoutes);
routes.use('/v1/admin/faculty', facultyRoutes);
routes.use('/v1/admin/instructions', instructionRoutes);
routes.use('/v1/admin/instructions', instructionEnrollmentRoutes);
routes.use('/v1/admin/enrollments', enrollmentRoutes);
routes.use('/v1/admin/academic-history', academicHistoryRoutes);
routes.use('/v1/admin/schedules', scheduleRoutes);
routes.use('/v1/admin/skills', skillRoutes);
routes.use('/v1/admin/violations', violationRoutes);
routes.use('/v1/admin/affiliations', affiliationRoutes);
routes.use('/v1/admin/events', eventRoutes);
routes.use('/v1/admin/research', researchRoutes);
routes.use('/v1/admin/uploads', uploadRoutes);
routes.use('/v1/admin/audit-logs', auditLogRoutes);
routes.use('/v1/admin/dashboard', dashboardRoutes);
routes.use('/v1/admin/analytics', analyticsRoutes);
routes.use('/v1/admin/reports', reportRoutes);
routes.use('/v1/admin/search', searchRoutes);
