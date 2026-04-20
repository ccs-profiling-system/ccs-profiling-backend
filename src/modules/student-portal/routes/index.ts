/**
 * Student Portal Routes
 * 
 * Aggregates all student portal routes under the /api/student prefix.
 * All routes require JWT authentication and student.* permissions.
 * 
 * Registered Routes:
 * - /api/student/profile - Profile management (GET, PUT)
 * - /api/student/dashboard - Dashboard summary (GET)
 * - /api/student/progress - Academic progress tracking (GET)
 * - /api/student/financial - Financial records (GET)
 * 
 * Requirements: 27.1, 27.2, 27.3, 27.4, 27.5
 */

import { Router } from 'express';
import { db } from '../../../db';

// Import controllers
import { ProfileController } from '../controllers/profile.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { ProgressController } from '../controllers/progress.controller';
import { FinancialController } from '../controllers/financial.controller';

// Import services
import { ProfileService } from '../services/profile.service';
import { DashboardService } from '../services/dashboard.service';
import { ProgressService } from '../services/progress.service';
import { FinancialService } from '../services/financial.service';

// Import route creators
import { createProfileRoutes } from './profile.routes';
import { createDashboardRoutes } from './dashboard.routes';
import { createProgressRoutes } from './progress.routes';
import { createFinancialRoutes } from './financial.routes';

// Initialize services
const profileService = new ProfileService(db);
const dashboardService = new DashboardService(db);
const progressService = new ProgressService(db);
const financialService = new FinancialService(db);

// Initialize controllers
const profileController = new ProfileController(profileService);
const dashboardController = new DashboardController(dashboardService);
const progressController = new ProgressController(progressService);
const financialController = new FinancialController(financialService);

// Create route modules
const profileRoutes = createProfileRoutes(profileController);
const dashboardRoutes = createDashboardRoutes(dashboardController);
const progressRoutes = createProgressRoutes(progressController);
const financialRoutes = createFinancialRoutes(financialController);

// Aggregate all student portal routes
export const studentPortalRouter = Router();

// Register profile routes (uses /student/profile pattern)
studentPortalRouter.use('/student/profile', profileRoutes);

// Register dashboard routes (uses /student/dashboard pattern)
studentPortalRouter.use('/student/dashboard', dashboardRoutes);

// Register progress routes (uses /student/progress pattern)
studentPortalRouter.use('/student/progress', progressRoutes);

// Register financial routes (uses /student/financial pattern)
studentPortalRouter.use('/student/financial', financialRoutes);
