/**
 * Audit Logs Module
 * Exports audit log routes and dependencies
 * 
 * Requirements: 19.1, 19.5, 30.2
 */

import { db } from '../../db';
import { AuditLogRepository } from './repositories/auditLog.repository';
import { AuditLogService } from './services/auditLog.service';
import { AuditLogController } from './controllers/auditLog.controller';
import { createAuditLogRoutes } from './routes/auditLog.routes';

// Initialize repository
const auditLogRepository = new AuditLogRepository(db);

// Initialize service
const auditLogService = new AuditLogService(auditLogRepository);

// Initialize controller
const auditLogController = new AuditLogController(auditLogService);

// Create routes
export const auditLogRoutes = createAuditLogRoutes(auditLogController);

// Export repository and service for use in other modules
export { auditLogRepository, auditLogService };
export * from './types';

