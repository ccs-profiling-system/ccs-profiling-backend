/**
 * Academic History Module
 * Exports all academic history-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and orchestration
 * - Repository: Database access layer
 */

import { db } from '../../db';
import { AcademicHistoryRepository } from './repositories/academicHistory.repository';
import { AcademicHistoryService } from './services/academicHistory.service';
import { AcademicHistoryController } from './controllers/academicHistory.controller';
import { 
  createAcademicHistoryRoutes,
  createStudentAcademicHistoryRoutes,
} from './routes/academicHistory.routes';
import { StudentRepository } from '../students/repositories/student.repository';

// Initialize repositories
const academicHistoryRepository = new AcademicHistoryRepository(db);
const studentRepository = new StudentRepository(db);

// Initialize service
const academicHistoryService = new AcademicHistoryService(
  academicHistoryRepository,
  studentRepository
);

// Initialize controller
const academicHistoryController = new AcademicHistoryController(academicHistoryService);

// Create routes
const academicHistoryRoutes = createAcademicHistoryRoutes(academicHistoryController);
const studentAcademicHistoryRoutes = createStudentAcademicHistoryRoutes(academicHistoryController);

// Exports
export { 
  academicHistoryRoutes,
  studentAcademicHistoryRoutes,
};
export * from './types';
export * from './schemas/academicHistory.schema';
export { AcademicHistoryRepository } from './repositories/academicHistory.repository';
export { AcademicHistoryService } from './services/academicHistory.service';
export { AcademicHistoryController } from './controllers/academicHistory.controller';
