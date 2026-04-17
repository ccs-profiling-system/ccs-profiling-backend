/**
 * Department Chair Portal Routes
 * 
 * Aggregates all chair portal routes under the /api/chair prefix.
 * All routes require JWT authentication and chair.* permissions.
 * 
 * Registered Routes:
 * - /api/chair/dashboard - Dashboard statistics
 * - /api/chair/students - Student management
 * - /api/chair/faculty - Faculty management
 * - /api/chair/schedules - Schedule management
 * - /api/chair/events - Event management
 * - /api/chair/research - Research project management
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
import { FacultyController } from '../controllers/faculty.controller';
import { FacultyService } from '../services/faculty.service';
import { createFacultyRoutes } from './faculty.routes';
import { ScheduleController } from '../controllers/schedule.controller';
import { ScheduleService } from '../services/schedule.service';
import { createScheduleRoutes } from './schedule.routes';
import { createEventRoutes } from './event.routes';
import { ResearchController } from '../controllers/research.controller';
import { ResearchService } from '../services/research.service';
import { createResearchRoutes } from './research.routes';

// Initialize services
const dashboardService = new DashboardService();
const studentService = new StudentService();
const facultyService = new FacultyService();
const scheduleService = new ScheduleService();
const researchService = new ResearchService();

// Initialize controllers
const dashboardController = new DashboardController(dashboardService);
const studentController = new StudentController(studentService);
const facultyController = new FacultyController(facultyService);
const scheduleController = new ScheduleController(scheduleService);
const researchController = new ResearchController(researchService);

// Create route modules
const dashboardRoutes = createDashboardRoutes(dashboardController);
const studentRoutes = createStudentRoutes(studentController);
const facultyRoutes = createFacultyRoutes(facultyController);
const scheduleRoutes = createScheduleRoutes(scheduleController);
const eventRoutes = createEventRoutes();
const researchRoutes = createResearchRoutes(researchController);

// Aggregate all chair portal routes
export const chairPortalRouter = Router();

// Register sub-routes
chairPortalRouter.use('/dashboard', dashboardRoutes);
chairPortalRouter.use('/students', studentRoutes);
chairPortalRouter.use('/faculty', facultyRoutes);
chairPortalRouter.use('/schedules', scheduleRoutes);
chairPortalRouter.use('/events', eventRoutes);
chairPortalRouter.use('/research', researchRoutes);
