/**
 * Skills Module
 * Exports all skill-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and orchestration
 * - Repository: Database access layer
 */

import { db } from '../../db';
import { SkillRepository } from './repositories/skill.repository';
import { SkillService } from './services/skill.service';
import { SkillController } from './controllers/skill.controller';
import { 
  createSkillRoutes,
  createStudentSkillRoutes,
} from './routes/skill.routes';
import { StudentRepository } from '../students/repositories/student.repository';

// Initialize repositories
const skillRepository = new SkillRepository(db);
const studentRepository = new StudentRepository(db);

// Initialize service
const skillService = new SkillService(
  skillRepository,
  studentRepository
);

// Initialize controller
const skillController = new SkillController(skillService);

// Create routes
const skillRoutes = createSkillRoutes(skillController);
const studentSkillRoutes = createStudentSkillRoutes(skillController);

// Exports
export { 
  skillRoutes,
  studentSkillRoutes,
};
export * from './types';
export * from './schemas/skill.schema';
export { SkillRepository } from './repositories/skill.repository';
export { SkillService } from './services/skill.service';
export { SkillController } from './controllers/skill.controller';
