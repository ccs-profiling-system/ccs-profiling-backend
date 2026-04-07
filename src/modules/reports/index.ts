/**
 * Reports Module
 * Exports report generation functionality
 * 
 */

import { db } from '../../db';
import { StudentRepository } from '../students/repositories/student.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { EntityCounterRepository } from '../../db/repositories/entityCounter.repository';
import { SkillRepository } from '../skills/repositories/skill.repository';
import { ViolationRepository } from '../violations/repositories/violation.repository';
import { AffiliationRepository } from '../affiliations/repositories/affiliation.repository';
import { AcademicHistoryRepository } from '../academic-history/repositories/academicHistory.repository';
import { EnrollmentRepository } from '../enrollments/repositories/enrollment.repository';
import { FacultyRepository } from '../faculty/repositories/faculty.repository';
import { AuditLogRepository } from '../audit-logs/repositories/auditLog.repository';
import { AuditLogger } from '../../shared/utils/auditLogger';
import { StudentService } from '../students/services/student.service';
import { FacultyService } from '../faculty/services/faculty.service';
import { AnalyticsService } from '../analytics/services/analytics.service';
import { ReportService } from './services/report.service';
import { ReportController } from './controllers/report.controller';
import { createReportRoutes } from './routes/report.routes';

// Initialize repositories
const studentRepository = new StudentRepository(db);
const userRepository = new UserRepository(db);
const entityCounterRepository = new EntityCounterRepository(db);
const skillRepository = new SkillRepository(db);
const violationRepository = new ViolationRepository(db);
const affiliationRepository = new AffiliationRepository(db);
const academicHistoryRepository = new AcademicHistoryRepository(db);
const enrollmentRepository = new EnrollmentRepository(db);
const facultyRepository = new FacultyRepository(db);
const auditLogRepository = new AuditLogRepository(db);

// Initialize audit logger
const auditLogger = new AuditLogger(auditLogRepository);

// Initialize services
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

const facultyService = new FacultyService(
  facultyRepository,
  userRepository,
  entityCounterRepository,
  db
);

const analyticsService = new AnalyticsService(db);

const reportService = new ReportService(
  studentService,
  facultyService,
  enrollmentRepository,
  analyticsService
);

// Initialize controller
const reportController = new ReportController(reportService);

// Create routes
export const reportRoutes = createReportRoutes(reportController);

// Export types
export * from './types';
