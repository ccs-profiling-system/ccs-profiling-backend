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
import { EntityCounterRepository } from '../../db/repositories/entityCounter.repository';
import { SkillRepository } from '../skills/repositories/skill.repository';
import { ViolationRepository } from '../violations/repositories/violation.repository';
import { AffiliationRepository } from '../affiliations/repositories/affiliation.repository';
import { AcademicHistoryRepository } from '../academic-history/repositories/academicHistory.repository';
import { EnrollmentRepository } from '../enrollments/repositories/enrollment.repository';
import { AuditLogRepository } from '../audit-logs/repositories/auditLog.repository';
import { AuditLogger } from '../../shared/utils/auditLogger';
import { StudentService } from './services/student.service';
import { StudentController } from './controllers/student.controller';
import { createStudentRoutes } from './routes/student.routes';

// Initialize repositories
const studentRepository = new StudentRepository(db);
const userRepository = new UserRepository(db);
const entityCounterRepository = new EntityCounterRepository(db);
const skillRepository = new SkillRepository(db);
const violationRepository = new ViolationRepository(db);
const affiliationRepository = new AffiliationRepository(db);
const academicHistoryRepository = new AcademicHistoryRepository(db);
const enrollmentRepository = new EnrollmentRepository(db);
const auditLogRepository = new AuditLogRepository(db);

// Initialize audit logger
const auditLogger = new AuditLogger(auditLogRepository);

// Initialize service with all required repositories
const studentService = new StudentService(
  studentRepository,
  userRepository,
  entityCounterRepository,
  skillRepository,
  violationRepository,
  affiliationRepository,
  academicHistoryRepository,
  enrollmentRepository,
  auditLogger,
  db
);

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
