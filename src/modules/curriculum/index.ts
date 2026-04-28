/**
 * Curriculum Module
 * Exports curriculum routes and dependencies
 */

import { CurriculumRepository } from './repositories/curriculum.repository';
import { CurriculumService } from './services/curriculum.service';
import { CurriculumController } from './controllers/curriculum.controller';
import { createCurriculumRoutes } from './routes/curriculum.routes';

// Initialize dependencies
const curriculumRepository = new CurriculumRepository();
const curriculumService = new CurriculumService(curriculumRepository);
const curriculumController = new CurriculumController(curriculumService);

// Export routes
export const curriculumRoutes = createCurriculumRoutes(curriculumController);

// Export for testing
export { CurriculumRepository, CurriculumService, CurriculumController };
