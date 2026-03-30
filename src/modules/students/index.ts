/**
 * Students Module
 * Exports all student-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and orchestration
 * - Repository: Database access layer
 */

import { db } from '../../db';
import { StudentRepository } from './repositories/student.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { StudentService } from './services/student.service';
import { StudentController } from './controllers/student.controller';
import { createStudentRoutes } from './routes/student.routes';

// Initialize repositories
const studentRepository = new StudentRepository(db);
const userRepository = new UserRepository(db);

// Initialize service
const studentService = new StudentService(studentRepository, userRepository, db);

// Initialize controller
const studentController = new StudentController(studentService);

// Create routes
const studentRoutes = createStudentRoutes(studentController);

// Exports
export { studentRoutes };
export * from './types';
export * from './schemas/student.schema';
export { StudentRepository } from './repositories/student.repository';
export { StudentService } from './services/student.service';
export { StudentController } from './controllers/student.controller';
