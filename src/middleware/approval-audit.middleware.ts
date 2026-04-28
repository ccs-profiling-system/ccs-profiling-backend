/**
 * Approval Audit Logging Middleware
 * 
 * Logs all approval-related actions to the audit log system.
 * Runs asynchronously (non-blocking) to avoid impacting response times.
 * Logs both successful and failed operations.
 * 
 */

import { Request, Response, NextFunction } from 'express';

// Lazy import to avoid circular dependency issues
let auditLogRepository: any;
async function getAuditLogRepository() {
  if (!auditLogRepository) {
    const module = await import('../modules/audit-logs');
    auditLogRepository = module.auditLogRepository;
  }
  return auditLogRepository;
}

/**
 * Extract IP address from request
 */
function getIpAddress(req: Request): string | undefined {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined
  );
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: Request): string | undefined {
  return req.headers['user-agent'] || undefined;
}

/**
 * Determine action type from request method and path
 */
function determineActionType(req: Request): string {
  const method = req.method;
  const path = req.path;

  // Submission actions
  if (method === 'POST' && path.includes('/approvals') && !path.includes('bulk')) {
    return 'approval_submitted';
  }

  // Approval/rejection actions
  if (method === 'PATCH' && path.includes('/approve')) {
    return 'approval_approved';
  }
  if (method === 'PATCH' && path.includes('/reject')) {
    return 'approval_rejected';
  }

  // Withdrawal action
  if (method === 'PATCH' && path.includes('/withdraw')) {
    return 'approval_withdrawn';
  }

  // Retry action
  if (method === 'PATCH' && path.includes('/retry')) {
    return 'approval_retried';
  }

  // Bulk operations
  if (method === 'POST' && path.includes('/bulk-approve')) {
    return 'approval_bulk_approved';
  }
  if (method === 'POST' && path.includes('/bulk-reject')) {
    return 'approval_bulk_rejected';
  }

  // Default action type
  return `approval_${method.toLowerCase()}`;
}

/**
 * Extract change request ID from request
 */
function extractChangeRequestId(req: Request): string | undefined {
  // From URL params
  if (req.params.id) {
    return req.params.id;
  }

  // From response body (for newly created requests)
  if (req.body?.id) {
    return req.body.id;
  }

  return undefined;
}

/**
 * Approval audit logging middleware
 * 
 * Captures approval workflow actions and logs them asynchronously.
 * Does not block the request-response cycle.
 */
export const approvalAuditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store original response methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Track if response has been sent
  let responseSent = false;
  let responseData: any = null;
  let statusCode: number = 200;

  // Override res.json to capture response data
  res.json = function (data: any) {
    if (!responseSent) {
      responseSent = true;
      responseData = data;
      statusCode = res.statusCode;
      
      // Log asynchronously after response is sent
      setImmediate(() => {
        logApprovalAction(req, statusCode, responseData).catch((error) => {
          console.error('Failed to log approval action:', error);
        });
      });
    }
    return originalJson(data);
  };

  // Override res.send to capture response data
  res.send = function (data: any) {
    if (!responseSent) {
      responseSent = true;
      responseData = data;
      statusCode = res.statusCode;
      
      // Log asynchronously after response is sent
      setImmediate(() => {
        logApprovalAction(req, statusCode, responseData).catch((error) => {
          console.error('Failed to log approval action:', error);
        });
      });
    }
    return originalSend(data);
  };

  next();
};

/**
 * Log approval action to audit log
 * Runs asynchronously and does not throw errors
 */
async function logApprovalAction(
  req: Request,
  statusCode: number,
  responseData: any
): Promise<void> {
  try {
    const repository = await getAuditLogRepository();
    
    const userId = req.user?.userId;
    const actionType = determineActionType(req);
    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    // Extract entity information
    let entityType = 'approval';
    let entityId: string | undefined;
    let changeRequestId: string | undefined;

    // Try to extract from response data
    if (responseData?.data) {
      const data = responseData.data;
      
      // Single approval response
      if (data.id) {
        changeRequestId = data.id;
        entityId = data.entity_id;
        entityType = data.entity_type || 'approval';
      }
      
      // Bulk operation response
      if (data.successful && Array.isArray(data.successful)) {
        // For bulk operations, log summary
        entityType = 'approval_bulk';
      }
    }

    // Try to extract from request params
    if (!changeRequestId) {
      changeRequestId = extractChangeRequestId(req);
    }

    // Build details object
    const details: Record<string, any> = {
      method: req.method,
      path: req.path,
      statusCode,
      success: statusCode >= 200 && statusCode < 300,
    };

    // Include request body for submissions (excluding sensitive data)
    if (actionType === 'approval_submitted' && req.body) {
      details.submission = {
        entity_type: req.body.entity_type,
        entity_id: req.body.entity_id,
        category: req.body.category,
      };
    }

    // Include comments for approval/rejection
    if ((actionType === 'approval_approved' || actionType === 'approval_rejected') && req.body?.comments) {
      details.comments = req.body.comments;
    }

    // Include previous status for state transitions
    if (responseData?.data?.status) {
      details.new_status = responseData.data.status;
    }

    // Include bulk operation summary
    if (actionType.includes('bulk') && responseData?.data) {
      details.bulk_summary = {
        total: responseData.data.total || 0,
        successful: responseData.data.successful?.length || 0,
        failed: responseData.data.failed?.length || 0,
      };
    }

    // Include error information for failed operations
    if (!details.success && responseData?.error) {
      details.error = {
        code: responseData.error.code,
        message: responseData.error.message,
      };
    }

    // Create audit log entry
    await repository.create({
      user_id: userId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: changeRequestId || entityId,
      after_state: details,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not block operations
    console.error('Failed to create approval audit log:', error);
  }
}

/**
 * Create a manual audit log entry for approval state transitions
 * Used by services to log state changes with previous status
 */
export async function logApprovalStateTransition(
  userId: string,
  changeRequestId: string,
  entityType: string,
  entityId: string,
  actionType: string,
  previousStatus: string,
  newStatus: string,
  additionalDetails?: Record<string, any>
): Promise<void> {
  try {
    const repository = await getAuditLogRepository();

    const details = {
      previous_status: previousStatus,
      new_status: newStatus,
      ...additionalDetails,
    };

    await repository.create({
      user_id: userId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: changeRequestId,
      before_state: { status: previousStatus },
      after_state: { status: newStatus, ...details },
    });
  } catch (error) {
    console.error('Failed to log approval state transition:', error);
  }
}
