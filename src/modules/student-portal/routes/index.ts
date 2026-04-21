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
 * - /api/student/notifications - Notification management (GET, PATCH)
 * - /api/student/courses - Course management (GET)
 * - /api/student/grades - Grade management (GET)
 * - /api/student/research - Research opportunities (GET, POST)
 * - /api/student/events - Event management (GET, POST)
 * - /api/student/advisor - Advisor communication (GET, POST)
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
import { NotificationController } from '../controllers/notification.controller';
import { CourseController } from '../controllers/course.controller';
import { GradeController } from '../controllers/grade.controller';
import { ResearchController } from '../controllers/research.controller';
import { EventController } from '../controllers/event.controller';
import { AdvisorController } from '../controllers/advisor.controller';

// Import services
import { ProfileService } from '../services/profile.service';
import { DashboardService } from '../services/dashboard.service';
import { ProgressService } from '../services/progress.service';
import { FinancialService } from '../services/financial.service';
import { NotificationService } from '../services/notification.service';
import { CourseService } from '../services/course.service';
import { GradeService } from '../services/grade.service';
import { ResearchService } from '../services/research.service';
import { EventService } from '../services/event.service';
import { AdvisorService } from '../services/advisor.service';

// Import route creators
import { createProfileRoutes } from './profile.routes';
import { createDashboardRoutes } from './dashboard.routes';
import { createProgressRoutes } from './progress.routes';
import { createFinancialRoutes } from './financial.routes';
import { createNotificationRoutes } from './notification.routes';
import { createCourseRoutes } from './course.routes';
import { createGradeRoutes } from './grade.routes';
import { createResearchRoutes } from './research.routes';
import { createEventRoutes } from './event.routes';
import { createAdvisorRoutes } from './advisor.routes';

// Initialize services
const profileService = new ProfileService(db);
const dashboardService = new DashboardService(db);
const progressService = new ProgressService(db);
const financialService = new FinancialService(db);
const notificationService = new NotificationService(db);
const courseService = new CourseService(db);
const gradeService = new GradeService(db);
const researchService = new ResearchService(db);
const eventService = new EventService(db);
const advisorService = new AdvisorService(db);

// Initialize controllers
const profileController = new ProfileController(profileService);
const dashboardController = new DashboardController(dashboardService);
const progressController = new ProgressController(progressService);
const financialController = new FinancialController(financialService);
const notificationController = new NotificationController(notificationService);
const courseController = new CourseController(courseService);
const gradeController = new GradeController(gradeService);
const researchController = new ResearchController(researchService);
const eventController = new EventController(eventService);
const advisorController = new AdvisorController(advisorService);

// Create route modules
const profileRoutes = createProfileRoutes(profileController);
const dashboardRoutes = createDashboardRoutes(dashboardController);
const progressRoutes = createProgressRoutes(progressController);
const financialRoutes = createFinancialRoutes(financialController);
const notificationRoutes = createNotificationRoutes(notificationController);
const courseRoutes = createCourseRoutes(courseController);
const gradeRoutes = createGradeRoutes(gradeController);
const researchRoutes = createResearchRoutes(researchController);
const eventRoutes = createEventRoutes(eventController);
const advisorRoutes = createAdvisorRoutes(advisorController);

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

// Register notification routes (uses /student/notifications pattern)
studentPortalRouter.use('/student/notifications', notificationRoutes);

// Register course routes (uses /student/courses pattern)
studentPortalRouter.use('/student/courses', courseRoutes);

// Register grade routes (uses /student/grades pattern)
studentPortalRouter.use('/student/grades', gradeRoutes);

// Register research routes (uses /student/research pattern)
studentPortalRouter.use('/student/research', researchRoutes);

// Register event routes (uses /student/events pattern)
studentPortalRouter.use('/student/events', eventRoutes);

// Register advisor routes (uses /student/advisor pattern)
studentPortalRouter.use('/student/advisor', advisorRoutes);
