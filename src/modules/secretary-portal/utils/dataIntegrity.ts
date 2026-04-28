/**
 * Data Integrity Utilities
 * Centralized utilities for enforcing data integrity constraints
 * 
 */

import { ValidationError } from '../../../shared/errors';
import { ApprovalStatus } from '../types';

/**
 * Valid state transitions for approval workflows
 * 
 */
const APPROVAL_STATE_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  draft: ['pending_approval', 'withdrawn'],
  pending_approval: ['approved', 'rejected', 'withdrawn'],
  approved: [], // Terminal state - no transitions allowed
  rejected: ['draft'], // Can be revised and resubmitted
  withdrawn: ['draft'], // Can be revised and resubmitted
};

/**
 * Validate state transition for approval workflows
 * 
 * @param currentStatus - Current approval status
 * @param newStatus - Desired new status
 * @throws ValidationError if transition is invalid
 * 
 */
export function validateStateTransition(
  currentStatus: ApprovalStatus,
  newStatus: ApprovalStatus
): void {
  const allowedTransitions = APPROVAL_STATE_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions.includes(newStatus)) {
    throw new ValidationError(
      `Invalid state transition from '${currentStatus}' to '${newStatus}'. ` +
      `Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none'}`
    );
  }
}

/**
 * Check if an entity can be updated based on its approval status
 * 
 * @param status - Current approval status
 * @returns true if entity can be updated
 * 
 */
export function canUpdate(status: ApprovalStatus): boolean {
  // Only draft and rejected entities can be updated
  return status === 'draft' || status === 'rejected';
}

/**
 * Check if an entity can be deleted based on its approval status
 * 
 * @param status - Current approval status
 * @returns true if entity can be deleted
 * 
 */
export function canDelete(status: ApprovalStatus): boolean {
  // Only draft and withdrawn entities can be deleted
  return status === 'draft' || status === 'withdrawn';
}

/**
 * Check if an entity can be submitted for approval
 * 
 * @param status - Current approval status
 * @returns true if entity can be submitted
 * 
 */
export function canSubmit(status: ApprovalStatus): boolean {
  // Only draft and rejected entities can be submitted
  return status === 'draft' || status === 'rejected';
}

/**
 * Check if an entity can be withdrawn
 * 
 * @param status - Current approval status
 * @returns true if entity can be withdrawn
 * 
 */
export function canWithdraw(status: ApprovalStatus): boolean {
  // Only pending_approval entities can be withdrawn
  return status === 'pending_approval';
}

/**
 * Validate entity existence
 * 
 * @param entity - Entity to validate
 * @param entityType - Type of entity for error message
 * @throws ValidationError if entity does not exist
 * 
 */
export function validateEntityExists<T>(
  entity: T | null | undefined,
  entityType: string
): asserts entity is T {
  if (!entity) {
    throw new ValidationError(`${entityType} not found`);
  }
}

/**
 * Validate unique constraint
 * 
 * @param exists - Whether a duplicate exists
 * @param fieldName - Name of the field for error message
 * @throws ValidationError if duplicate exists
 * 
 */
export function validateUnique(exists: boolean, fieldName: string): void {
  if (exists) {
    throw new ValidationError(`${fieldName} already exists`);
  }
}

/**
 * Validate date range
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @param startLabel - Label for start date in error message
 * @param endLabel - Label for end date in error message
 * @throws ValidationError if end date is before start date
 */
export function validateDateRange(
  startDate: Date | string,
  endDate: Date | string,
  startLabel: string = 'Start date',
  endLabel: string = 'End date'
): void {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (end <= start) {
    throw new ValidationError(`${endLabel} must be after ${startLabel}`);
  }
}

/**
 * Validate date is not in the past
 * 
 * @param date - Date to validate
 * @param label - Label for date in error message
 * @throws ValidationError if date is in the past
 */
export function validateNotPastDate(
  date: Date | string,
  label: string = 'Date'
): void {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (checkDate < today) {
    throw new ValidationError(`${label} cannot be in the past`);
  }
}

/**
 * Validate positive integer
 * 
 * @param value - Value to validate
 * @param label - Label for value in error message
 * @throws ValidationError if value is not a positive integer
 */
export function validatePositiveInteger(
  value: number,
  label: string = 'Value'
): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${label} must be a positive integer`);
  }
}

/**
 * Transaction wrapper with automatic rollback on error
 * 
 * This is a type helper for documenting transaction usage.
 * Drizzle ORM automatically handles rollback on errors.
 * 
 */
export type TransactionCallback<T> = () => Promise<T>;

/**
 * Soft delete marker
 * 
 * Returns the current timestamp for marking records as deleted
 * 
 */
export function softDeleteTimestamp(): Date {
  return new Date();
}
