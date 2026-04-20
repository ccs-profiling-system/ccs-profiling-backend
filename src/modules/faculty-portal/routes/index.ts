/**
 * Faculty Portal Routes
 * 
 * Aggregates all faculty portal routes under the /api/faculty and /api/admin/faculty prefixes.
 * All routes require JWT authentication and faculty.* permissions.
 * 
 * Registered Routes:
 * - /api/admin/faculty/:facultyId/profile - Profile management (GET, PUT)
 * - /api/faculty/courses - Course assignments (GET)
 * - /api/faculty/teaching-load - Teaching load summary (GET)
 * - /api/faculty/courses/:courseId/roster - Student roster (GET)
 * - /api/faculty/courses/:courseId/attendance - Attendance management (GET, POST)
 * - /api/faculty/research - Research project management (GET, POST, PUT)
 * - /api/faculty/events - Event viewing and registration (GET, POST)
 * - /api/faculty/courses/:courseId/materials - Course material management (GET, POST, DELETE)
 * 
 * Requirements: 1.6, 15.5
 */

import { Router } from 'express';
import { db } from '../../../db';

// Import controllers
import { ProfileController } from '../controllers/profile.controller';
import { CourseController } from '../controllers/course.controller';
import { RosterController } from '../controllers/roster.controller';
import { AttendanceController } from '../controllers/attendance.controller';
import { ResearchController } from '../controllers/research.controller';
import { EventController } from '../controllers/event.controller';
import { MaterialController } from '../controllers/material.controller';
import { SkillsController } from '../controllers/skills.controller';
import { AffiliationsController } from '../controllers/affiliations.controller';

// Import services
import { ProfileService } from '../services/profile.service';
import { CourseService } from '../services/course.service';
import { RosterService } from '../services/roster.service';
import { AttendanceService } from '../services/attendance.service';
import { ResearchService } from '../services/research.service';
import { EventService } from '../services/event.service';
import { MaterialService } from '../services/material.service';
import { SkillsService } from '../services/skills.service';
import { AffiliationsService } from '../services/affiliations.service';

// Import route creators
import { createProfileRoutes } from './profile.routes';
import { createCourseRoutes } from './course.routes';
import { createRosterRoutes } from './roster.routes';
import { createAttendanceRoutes } from './attendance.routes';
import { createResearchRoutes } from './research.routes';
import { createEventRoutes } from './event.routes';
import { createMaterialRoutes } from './material.routes';
import { createSkillsRoutes } from './skills.routes';
import { createAffiliationsRoutes } from './affiliations.routes';

// Initialize services
const profileService = new ProfileService(db);
const courseService = new CourseService(db);
const rosterService = new RosterService(db);
const attendanceService = new AttendanceService(db);
const researchService = new ResearchService(db);
const eventService = new EventService(db);
const materialService = new MaterialService(db);
const skillsService = new SkillsService(db);
const affiliationsService = new AffiliationsService(db);

// Initialize controllers
const profileController = new ProfileController(profileService);
const courseController = new CourseController(courseService);
const rosterController = new RosterController(rosterService);
const attendanceController = new AttendanceController(attendanceService);
const researchController = new ResearchController(researchService);
const eventController = new EventController(eventService);
const materialController = new MaterialController(materialService);
const skillsController = new SkillsController(skillsService);
const affiliationsController = new AffiliationsController(affiliationsService);

// Create route modules
const profileRoutes = createProfileRoutes(profileController);
const courseRoutes = createCourseRoutes(courseController);
const rosterRoutes = createRosterRoutes(rosterController);
const attendanceRoutes = createAttendanceRoutes(attendanceController);
const researchRoutes = createResearchRoutes(researchController);
const eventRoutes = createEventRoutes(eventController);
const materialRoutes = createMaterialRoutes(materialController);
const skillsRoutes = createSkillsRoutes(skillsController);
const affiliationsRoutes = createAffiliationsRoutes(affiliationsController);

// Aggregate all faculty portal routes
export const facultyPortalRouter = Router();

// Register profile routes (uses /admin/faculty/:facultyId pattern)
facultyPortalRouter.use('/admin/faculty', profileRoutes);

// Register faculty-specific routes (uses /faculty pattern)
facultyPortalRouter.use('/faculty', courseRoutes);
facultyPortalRouter.use('/faculty', rosterRoutes);
facultyPortalRouter.use('/faculty', attendanceRoutes);
facultyPortalRouter.use('/faculty', researchRoutes);
facultyPortalRouter.use('/faculty', eventRoutes);
facultyPortalRouter.use('/faculty', materialRoutes);

// Register profile sub-resources (uses /faculty/profile pattern)
facultyPortalRouter.use('/faculty/profile/skills', skillsRoutes);
facultyPortalRouter.use('/faculty/profile/affiliations', affiliationsRoutes);
