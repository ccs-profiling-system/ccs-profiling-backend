/**
 * Base error class for all application errors
 * Provides consistent error structure with message, code, status, and optional details
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * NotFoundError - 404
 * Used when a requested resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * ValidationError - 400
 * Used when input validation fails
 */
export class ValidationError extends AppError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * UnauthorizedError - 401
 * Used when authentication fails or token is invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * ForbiddenError - 403
 * Used when user lacks required permissions
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * ConflictError - 409
 * Used when operation conflicts with existing state (e.g., duplicate records, scheduling conflicts)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}
