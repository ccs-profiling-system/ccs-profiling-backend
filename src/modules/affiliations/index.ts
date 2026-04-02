/**
 * Affiliations Module
 * Exports all affiliation-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and orchestration
 * - Repository: Database access layer
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { db } from '../../db';
import { AffiliationRepository } from './repositories/affiliation.repository';
import { AffiliationService } from './services/affiliation.service';
import { AffiliationController } from './controllers/affiliation.controller';
import { 
  createAffiliationRoutes,
  createStudentAffiliationRoutes,
} from './routes/affiliation.routes';
import { StudentRepository } from '../students/repositories/student.repository';

// Initialize repositories
const affiliationRepository = new AffiliationRepository(db);
const studentRepository = new StudentRepository(db);

// Initialize service
const affiliationService = new AffiliationService(
  affiliationRepository,
  studentRepository
);

// Initialize controller
const affiliationController = new AffiliationController(affiliationService);

// Create routes
const affiliationRoutes = createAffiliationRoutes(affiliationController);
const studentAffiliationRoutes = createStudentAffiliationRoutes(affiliationController);

// Exports
export { 
  affiliationRoutes,
  studentAffiliationRoutes,
};
export * from './types';
export * from './schemas/affiliation.schema';
export { AffiliationRepository } from './repositories/affiliation.repository';
export { AffiliationService } from './services/affiliation.service';
export { AffiliationController } from './controllers/affiliation.controller';
