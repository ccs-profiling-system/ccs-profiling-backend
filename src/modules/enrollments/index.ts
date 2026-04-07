/**
 * Enrollment Module
 * Exports all enrollment-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and orchestration
 * - Repository: Database access layer
 */

import { db } from '../../db';
import { EnrollmentRepository } from './repositories/enrollment.repository';
import { EnrollmentService } from './services/enrollment.service';
import { EnrollmentController } from './controllers/enrollment.controller';
import { 
  createEnrollmentRoutes,
  createStudentEnrollmentRoutes,
  createInstructionEnrollmentRoutes,
} from './routes/enrollment.routes';
import { StudentRepository } from '../students/repositories/student.repository';
import { InstructionRepository } from '../instructions/repositories/instruction.repository';

// Initialize repositories
const enrollmentRepository = new EnrollmentRepository(db);
const studentRepository = new StudentRepository(db);
const instructionRepository = new InstructionRepository(db);

// Initialize service
const enrollmentService = new EnrollmentService(
  enrollmentRepository,
  studentRepository,
  instructionRepository
);

// Initialize controller
const enrollmentController = new EnrollmentController(enrollmentService);

// Create routes
const enrollmentRoutes = createEnrollmentRoutes(enrollmentController);
const studentEnrollmentRoutes = createStudentEnrollmentRoutes(enrollmentController);
const instructionEnrollmentRoutes = createInstructionEnrollmentRoutes(enrollmentController);

// Exports
export { 
  enrollmentRoutes,
  studentEnrollmentRoutes,
  instructionEnrollmentRoutes,
};
export * from './types';
export * from './schemas/enrollment.schema';
export { EnrollmentRepository } from './repositories/enrollment.repository';
export { EnrollmentService } from './services/enrollment.service';
export { EnrollmentController } from './controllers/enrollment.controller';
