/**
 * Search Module
 * Exports all search-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and orchestration
 * - Repositories: Reuses existing entity repositories
 */

import { db } from '../../db';
import { StudentRepository } from '../students/repositories/student.repository';
import { FacultyRepository } from '../faculty/repositories/faculty.repository';
import { EventRepository } from '../events/repositories/event.repository';
import { ResearchRepository } from '../research/repositories/research.repository';
import { SearchService } from './services/search.service';
import { SearchController } from './controllers/search.controller';
import { createSearchRoutes } from './routes/search.routes';

// Initialize repositories (reuse existing entity repositories)
const studentRepository = new StudentRepository(db);
const facultyRepository = new FacultyRepository(db);
const eventRepository = new EventRepository(db);
const researchRepository = new ResearchRepository(db);

// Initialize service
const searchService = new SearchService(
  studentRepository,
  facultyRepository,
  eventRepository,
  researchRepository
);

// Initialize controller
const searchController = new SearchController(searchService);

// Create routes
const searchRoutes = createSearchRoutes(searchController);

// Exports
export { searchRoutes };
export * from './types';
export * from './schemas/search.schema';
export { SearchService } from './services/search.service';
export { SearchController } from './controllers/search.controller';
