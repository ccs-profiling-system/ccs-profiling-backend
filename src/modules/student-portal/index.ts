/**
 * Student Portal Module
 * 
 * Main entry point for the student portal API module.
 * Exports all shared utilities, types, and schemas.
 */

// Export student scoping utilities
export {
  extractStudentId,
  validateStudentOwnership,
  extractAndValidateStudentId,
  isStudent,
  StudentAccessError,
  type StudentUserContext,
} from './utils/studentScope';

// Export all types and DTOs
export type {
  StudentScope,
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  NotificationType,
  EnrollmentStatus,
  AcademicStanding,
  ResearchApplicationStatus,
  EventRegistrationStatus,
  AppointmentStatus,
  MessageSenderRole,
  StudentProfileDTO,
  DashboardSummaryDTO,
  AcademicProgressDTO,
  FinancialRecordDTO,
  NotificationDTO,
  CourseDTO,
  CourseDetailsDTO,
  ScheduleEntryDTO,
  WeeklyScheduleDTO,
  GradeDTO,
  GPADTO,
  GradeHistoryDTO,
  ResearchOpportunityDTO,
  ResearchOpportunityDetailsDTO,
  ResearchApplicationStatusDTO,
  EventDTO,
  RegisteredEventDTO,
  AdvisorDTO,
  MessageDTO,
  AppointmentSlotDTO,
  AppointmentDTO,
} from './types';

// Export common validation schemas
export {
  paginationSchema,
  emailSchema,
  optionalEmailSchema,
  phoneSchema,
  optionalPhoneSchema,
  dateSchema,
  optionalDateSchema,
  dateTimeSchema,
  optionalDateTimeSchema,
  uuidSchema,
  nonEmptyStringSchema,
  optionalNonEmptyStringSchema,
  notificationTypeSchema,
  enrollmentStatusSchema,
  academicStandingSchema,
  researchApplicationStatusSchema,
  eventRegistrationStatusSchema,
  appointmentStatusSchema,
  messageSenderRoleSchema,
  idParamSchema,
  studentIdParamSchema,
  calculatePaginationMeta,
  calculateOffset,
} from './schemas/common.schemas';
