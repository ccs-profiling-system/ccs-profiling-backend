/**
 * Syllabus Module
 * Exports syllabus routes and dependencies
 */

import { SyllabusRepository } from './repositories/syllabus.repository';
import { SyllabusService } from './services/syllabus.service';
import { SyllabusController } from './controllers/syllabus.controller';
import { createSyllabusRoutes } from './routes/syllabus.routes';

// Initialize dependencies
const syllabusRepository = new SyllabusRepository();
const syllabusService = new SyllabusService(syllabusRepository);
const syllabusController = new SyllabusController(syllabusService);

// Export routes
export const syllabusRoutes = createSyllabusRoutes(syllabusController);

// Export for testing
export { SyllabusRepository, SyllabusService, SyllabusController };
