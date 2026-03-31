/**
 * Faculty Module
 * Exports all faculty-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and orchestration
 * - Repository: Database access layer
 */

import { db } from '../../db';
import { FacultyRepository } from './repositories/faculty.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { FacultyService } from './services/faculty.service';
import { FacultyController } from './controllers/faculty.controller';
import { createFacultyRoutes } from './routes/faculty.routes';

// Initialize repositories
const facultyRepository = new FacultyRepository(db);
const userRepository = new UserRepository(db);

// Initialize service
const facultyService = new FacultyService(facultyRepository, userRepository, db);

// Initialize controller
const facultyController = new FacultyController(facultyService);

// Create routes
const facultyRoutes = createFacultyRoutes(facultyController);

// Exports
export { facultyRoutes };
export * from './types';
export * from './schemas/faculty.schema';
export { FacultyRepository } from './repositories/faculty.repository';
export { FacultyService } from './services/faculty.service';
export { FacultyController } from './controllers/faculty.controller';
