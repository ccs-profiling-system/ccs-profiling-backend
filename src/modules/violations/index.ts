/**
 * Violations Module
 * Exports all violation-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and orchestration
 * - Repository: Database access layer
 */

import { db } from '../../db';
import { ViolationRepository } from './repositories/violation.repository';
import { ViolationService } from './services/violation.service';
import { ViolationController } from './controllers/violation.controller';
import { 
  createViolationRoutes,
  createStudentViolationRoutes,
} from './routes/violation.routes';
import { StudentRepository } from '../students/repositories/student.repository';

// Initialize repositories
const violationRepository = new ViolationRepository(db);
const studentRepository = new StudentRepository(db);

// Initialize service
const violationService = new ViolationService(
  violationRepository,
  studentRepository
);

// Initialize controller
const violationController = new ViolationController(violationService);

// Create routes
const violationRoutes = createViolationRoutes(violationController);
const studentViolationRoutes = createStudentViolationRoutes(violationController);

// Exports
export { 
  violationRoutes,
  studentViolationRoutes,
};
export * from './types';
export * from './schemas/violation.schema';
export { ViolationRepository } from './repositories/violation.repository';
export { ViolationService } from './services/violation.service';
export { ViolationController } from './controllers/violation.controller';
