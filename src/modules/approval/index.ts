/**
 * Approval Module
 * 
 * Provides comprehensive approval workflow system for managing change requests
 * within an academic institution. Supports secretary submissions, admin/chair
 * reviews, notifications, audit logging, and bulk operations.
 */

// Repositories
export * from './repositories/approval.repository';
export * from './repositories/notification.repository';
export * from './repositories/background-job.repository';

// Services
export * from './services/approval.service';
export * from './services/approval-statistics.service';
export * from './services/approval-state-machine.service';
export * from './services/department-assignment.service';
export * from './services/entity-application.service';
export * from './services/notification.service';

// Routes
export * from './routes/approval-secretary.routes';
export * from './routes/approval-admin.routes';
export * from './routes/approval-chair.routes';
export * from './routes/approval-shared.routes';
