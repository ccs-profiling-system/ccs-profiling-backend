/**
 * Pending Changes Controller
 * 
 * HTTP request/response handling for secretary portal pending changes operations.
 * Provides operations to view and withdraw pending changes.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllPendingChanges,
  withdrawPendingChange,
} from '../services/pendingChanges.service';
import { paginationSchema, idParamSchema, approvalStatusEnum } from '../schemas/common.schemas';
import { z } from 'zod';

/**
 * Pending changes filter schema
 * 
 * Query Parameters:
 * - entity_type: Filter by entity type (student, faculty, event, research, etc.)
 * - status: Filter by approval status
 */
const pendingChangesFilterSchema = z.object({
  entity_type: z.string().optional(),
  status: approvalStatusEnum.optional(),
});

/**
 * GET /api/secretary/pending-changes
 * 
 * Retrieve all pending changes with pagination and filtering.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - entity_type: Filter by entity type
 * - status: Filter by approval status
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with paginated pending changes list on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if pending changes retrieval fails
 * 
 */
export async function getAllPendingChangesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate pagination parameters
    const paginationResult = paginationSchema.safeParse(req.query);
    if (!paginationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paginationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    // Validate filter parameters
    const filterResult = pendingChangesFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: filterResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { page, limit } = paginationResult.data;
    const { entity_type, status } = filterResult.data;

    // Get pending changes from service
    const result = await getAllPendingChanges(
      { page, limit },
      { entity_type, status }
    );

    // Return HTTP 200 with paginated data
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * DELETE /api/secretary/pending-changes/:id
 * 
 * Withdraw a pending change.
 * Changes status from 'pending_approval' to 'withdrawn'.
 * Prevents withdrawal of changes with status 'approved' or 'rejected'.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with updated pending change on success
 * @returns HTTP 400 for validation errors or invalid state transitions
 * @returns HTTP 404 when pending change not found
 * @throws Error if withdrawal fails
 * 
 */
export async function withdrawPendingChangeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Get user ID from authenticated request
    const userId = (req as any).user?.id;

    // Get IP address and user agent for audit logging
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    // Withdraw pending change via service
    const result = await withdrawPendingChange(id, userId, ipAddress, userAgent);

    // Return HTTP 200 with updated pending change
    res.status(200).json({
      success: true,
      data: result,
      message: 'Pending change withdrawn successfully',
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}
