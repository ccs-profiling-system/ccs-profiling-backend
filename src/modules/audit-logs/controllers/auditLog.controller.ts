/**
 * Audit Log Controller
 * HTTP request/response handling for audit log operations
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/auditLog.service';
import { ValidationError } from '../../../shared/errors';
import {
  auditLogIdParamSchema,
  userIdParamSchema,
  entityParamSchema,
  auditLogListQuerySchema,
} from '../schemas/auditLog.schema';

export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  /**
   * GET /api/v1/admin/audit-logs
   * List audit logs with date range filtering
   */
  listAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = auditLogListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.auditLogService.listAuditLogs(filters);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/audit-logs/:id
   * Get audit log by ID
   */
  getAuditLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = auditLogIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid audit log ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const auditLog = await this.auditLogService.getAuditLog(id);

      res.json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/audit-logs/user/:userId
   * Get audit logs by user ID
   */
  getAuditLogsByUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate user ID parameter
      const paramValidation = userIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid user ID', paramValidation.error.errors);
      }

      // Validate query parameters
      const queryValidation = auditLogListQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Validation failed', queryValidation.error.errors);
      }

      const { userId } = paramValidation.data;
      const filters = queryValidation.data;

      const result = await this.auditLogService.listAuditLogsByUser(userId, filters);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/audit-logs/entity/:entityType/:entityId
   * Get audit logs by entity type and ID
   */
  getAuditLogsByEntity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate entity parameters
      const paramValidation = entityParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid entity parameters', paramValidation.error.errors);
      }

      // Validate query parameters
      const queryValidation = auditLogListQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Validation failed', queryValidation.error.errors);
      }

      const { entityType, entityId } = paramValidation.data;
      const filters = queryValidation.data;

      const result = await this.auditLogService.listAuditLogsByEntity(
        entityType,
        entityId,
        filters
      );

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };
}
