/**
 * Subjects Module
 * Exports subject routes and dependencies
 */

import { SubjectRepository } from './repositories/subject.repository';
import { SubjectService } from './services/subject.service';
import { SubjectController } from './controllers/subject.controller';
import { createSubjectRoutes } from './routes/subject.routes';

// Initialize dependencies
const subjectRepository = new SubjectRepository();
const subjectService = new SubjectService(subjectRepository);
const subjectController = new SubjectController(subjectService);

// Export routes
export const subjectRoutes = createSubjectRoutes(subjectController);

// Export for testing
export { SubjectRepository, SubjectService, SubjectController };
