/**
 * Department Chair Portal Routes
 * 
 * Aggregates all chair portal routes under the /api/chair prefix.
 * All routes require JWT authentication and chair.* permissions.
 * 
 * Registered Routes:
 * - /api/chair/dashboard - Dashboard statistics
 * - /api/chair/students - Student management
 * 
 * Requirements: 1.6, 14.1
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { createDashboardRoutes } from './dashboard.routes';
import { StudentController } from '../controllers/student.controller';
import { StudentService } from '../services/student.service';
import { createStudentRoutes } from './student.routes';

// Initialize services
const dashboardService = new DashboardService();
const studentService = new StudentService();

// Initialize controllers
const dashboardController = new DashboardController(dashboardService);
const studentController = new StudentController(studentService);

// Create route modules
const dashboardRoutes = createDashboardRoutes(dashboardController);
const studentRoutes = createStudentRoutes(studentController);

// Aggregate all chair portal routes
export const chairPortalRouter = Router();

// Register sub-routes
chairPortalRouter.use('/dashboard', dashboardRoutes);
chairPortalRouter.use('/students', studentRoutes);
