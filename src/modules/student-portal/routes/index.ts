/**
 * Student Portal Routes
 * 
 * Aggregates all student portal routes under the /api/student prefix.
 * All routes require JWT authentication and student.* permissions.
 * 
 * Registered Routes (Core Profiling Features):
 * - /api/student/profile - Profile management (GET, PUT)
 * - /api/student/dashboard - Dashboard summary (GET)
 * - /api/student/progress - Academic progress tracking (GET)
 * - /api/student/notifications - Notification management (GET, PATCH) [Optional]
 * - /api/student/courses - Course management (GET)
 * - /api/student/grades - Grade management (GET)
 * - /api/student/research - Research opportunities (GET only - view only)
 * - /api/student/events - Event management (GET only - view only)
 * 
 * Removed Routes (Non-Core Features):
 * - /api/student/financial - REMOVED (belongs to Billing System)
 * - /api/student/advisor - REMOVED (belongs to LMS/Support System)
 * 
 */

import { Router } from 'express';
import { db } from '../../../db';

// Import controllers
import { ProfileController } from '../controllers/profile.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { ProgressController } from '../controllers/progress.controller';
import { NotificationController } from '../controllers/notification.controller';
import { CourseController } from '../controllers/course.controller';
import { GradeController } from '../controllers/grade.controller';
import { ResearchController } from '../controllers/research.controller';
import { EventController } from '../controllers/event.controller';

// Import services
import { ProfileService } from '../services/profile.service';
import { DashboardService } from '../services/dashboard.service';
import { ProgressService } from '../services/progress.service';
import { NotificationService } from '../services/notification.service';
import { CourseService } from '../services/course.service';
import { GradeService } from '../services/grade.service';
import { ResearchService } from '../services/research.service';
import { EventService } from '../services/event.service';

// Import route creators
import { createProfileRoutes } from './profile.routes';
import { createDashboardRoutes } from './dashboard.routes';
import { createProgressRoutes } from './progress.routes';
import { createNotificationRoutes } from './notification.routes';
import { createCourseRoutes } from './course.routes';
import { createGradeRoutes } from './grade.routes';
import { createResearchRoutes } from './research.routes';
import { createEventRoutes } from './event.routes';

// Initialize services
const profileService = new ProfileService(db);
const dashboardService = new DashboardService(db);
const progressService = new ProgressService(db);
const notificationService = new NotificationService(db);
const courseService = new CourseService(db);
const gradeService = new GradeService(db);
const researchService = new ResearchService(db);
const eventService = new EventService(db);

// Initialize controllers
const profileController = new ProfileController(profileService);
const dashboardController = new DashboardController(dashboardService);
const progressController = new ProgressController(progressService);
const notificationController = new NotificationController(notificationService);
const courseController = new CourseController(courseService);
const gradeController = new GradeController(gradeService);
const researchController = new ResearchController(researchService);
const eventController = new EventController(eventService);

// Create route modules
const profileRoutes = createProfileRoutes(profileController);
const dashboardRoutes = createDashboardRoutes(dashboardController);
const progressRoutes = createProgressRoutes(progressController);
const notificationRoutes = createNotificationRoutes(notificationController);
const courseRoutes = createCourseRoutes(courseController);
const gradeRoutes = createGradeRoutes(gradeController);
const researchRoutes = createResearchRoutes(researchController);
const eventRoutes = createEventRoutes(eventController);

// Aggregate all student portal routes
export const studentPortalRouter = Router();

// Register profile routes (uses /student/profile pattern)
studentPortalRouter.use('/student/profile', profileRoutes);

// Register dashboard routes (uses /student/dashboard pattern)
studentPortalRouter.use('/student/dashboard', dashboardRoutes);

// Register progress routes (uses /student/progress pattern)
studentPortalRouter.use('/student/progress', progressRoutes);

// Register notification routes (uses /student/notifications pattern) [Optional - UX Enhancement]
studentPortalRouter.use('/student/notifications', notificationRoutes);

// Register course routes (uses /student/courses pattern)
studentPortalRouter.use('/student/courses', courseRoutes);

// Register grade routes (uses /student/grades pattern)
studentPortalRouter.use('/student/grades', gradeRoutes);

// Register research routes (uses /student/research pattern) [View only - no apply]
studentPortalRouter.use('/student/research', researchRoutes);

// Register event routes (uses /student/events pattern) [View only - no register]
studentPortalRouter.use('/student/events', eventRoutes);

// REMOVED: Financial routes - belongs to Billing System
// REMOVED: Advisor routes - belongs to LMS/Support System

