/**
 * Workflow State Validation Utilities
 * 
 * Provides validation functions for workflow state transitions in the chair portal.
 * These functions ensure that approval, rejection, and update operations are only
 * performed on resources in valid states.
 * 
 * Workflow state transitions:
 * - draft → pending_approval (submit for approval)
 * - pending_approval → approved (approve)
 * - pending_approval → rejected (reject)
 * - draft/pending_approval → updated (edit)
 * 
 * Invalid transitions return descriptive error messages for HTTP 400 Bad Request responses.
 */

import { WorkflowState } from '../types';

/**
 * Result of workflow state validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a resource can be approved
 * 
 * Approval is only allowed when the resource is in 'pending_approval' state.
 * Resources in draft, approved, or rejected states cannot be approved.
 * 
 * @param currentState - Current workflow state of the resource
 * @returns Validation result with error message if invalid
 * 
 * @example
 * ```typescript
 * const validation = validateApprovalState(student.status);
 * if (!validation.valid) {
 *   return res.status(400).json({ error: validation.error });
 * }
 * ```
 */
export function validateApprovalState(currentState: WorkflowState): ValidationResult {
  if (currentState === 'pending_approval') {
    return { valid: true };
  }

  const errorMessages: Record<WorkflowState, string> = {
    draft: 'Cannot approve a resource in draft state. The resource must be submitted for approval first.',
    pending_approval: '', // This case is handled above
    approved: 'Cannot approve a resource that is already approved.',
    rejected: 'Cannot approve a resource that has been rejected. Create a new submission instead.',
  };

  return {
    valid: false,
    error: errorMessages[currentState] || `Cannot approve resource in '${currentState}' state.`,
  };
}

/**
 * Validate that a resource can be rejected
 * 
 * Rejection is only allowed when the resource is in 'pending_approval' state.
 * Resources in draft, approved, or rejected states cannot be rejected.
 * 
 * @param currentState - Current workflow state of the resource
 * @returns Validation result with error message if invalid
 * 
 * @example
 * ```typescript
 * const validation = validateRejectionState(research.status);
 * if (!validation.valid) {
 *   return res.status(400).json({ error: validation.error });
 * }
 * ```
 */
export function validateRejectionState(currentState: WorkflowState): ValidationResult {
  if (currentState === 'pending_approval') {
    return { valid: true };
  }

  const errorMessages: Record<WorkflowState, string> = {
    draft: 'Cannot reject a resource in draft state. The resource must be submitted for approval first.',
    pending_approval: '', // This case is handled above
    approved: 'Cannot reject a resource that is already approved. Consider creating a reversal or cancellation instead.',
    rejected: 'Cannot reject a resource that has already been rejected.',
  };

  return {
    valid: false,
    error: errorMessages[currentState] || `Cannot reject resource in '${currentState}' state.`,
  };
}

/**
 * Validate that a resource can be updated
 * 
 * Updates are only allowed when the resource is in 'draft' or 'pending_approval' state.
 * Resources that are approved or rejected cannot be updated (they are immutable).
 * 
 * @param currentState - Current workflow state of the resource
 * @returns Validation result with error message if invalid
 * 
 * @example
 * ```typescript
 * const validation = validateUpdateState(event.status);
 * if (!validation.valid) {
 *   return res.status(400).json({ error: validation.error });
 * }
 * ```
 */
export function validateUpdateState(currentState: WorkflowState): ValidationResult {
  if (currentState === 'draft' || currentState === 'pending_approval') {
    return { valid: true };
  }

  const errorMessages: Record<WorkflowState, string> = {
    draft: '', // This case is handled above
    pending_approval: '', // This case is handled above
    approved: 'Cannot update an approved resource. Approved resources are immutable. Create a new submission if changes are needed.',
    rejected: 'Cannot update a rejected resource. Rejected resources are immutable. Create a new submission instead.',
  };

  return {
    valid: false,
    error: errorMessages[currentState] || `Cannot update resource in '${currentState}' state.`,
  };
}

/**
 * Validate that a resource can be deleted
 * 
 * Deletion is typically only allowed for draft resources.
 * Some resources may allow cancellation of approved items with proper logging.
 * 
 * @param currentState - Current workflow state of the resource
 * @param allowApprovedDeletion - Whether to allow deletion of approved resources (default: false)
 * @returns Validation result with error message if invalid
 * 
 * @example
 * ```typescript
 * // Only allow deletion of drafts
 * const validation = validateDeleteState(event.status);
 * 
 * // Allow cancellation of approved events
 * const validation = validateDeleteState(event.status, true);
 * ```
 */
export function validateDeleteState(
  currentState: WorkflowState,
  allowApprovedDeletion: boolean = false
): ValidationResult {
  if (currentState === 'draft') {
    return { valid: true };
  }

  if (currentState === 'approved' && allowApprovedDeletion) {
    return { valid: true };
  }

  const errorMessages: Record<WorkflowState, string> = {
    draft: '', // This case is handled above
    pending_approval: 'Cannot delete a resource pending approval. Reject the resource first, or withdraw the submission.',
    approved: allowApprovedDeletion
      ? '' // This case is handled above
      : 'Cannot delete an approved resource. Approved resources are immutable.',
    rejected: 'Cannot delete a rejected resource. Rejected resources are kept for audit purposes.',
  };

  return {
    valid: false,
    error: errorMessages[currentState] || `Cannot delete resource in '${currentState}' state.`,
  };
}

/**
 * Get all valid next states for a given current state
 * 
 * Useful for displaying available actions to users or validating state transitions.
 * 
 * @param currentState - Current workflow state
 * @returns Array of valid next states
 * 
 * @example
 * ```typescript
 * const nextStates = getValidNextStates('draft');
 * // Returns: ['pending_approval']
 * ```
 */
export function getValidNextStates(currentState: WorkflowState): WorkflowState[] {
  const transitions: Record<WorkflowState, WorkflowState[]> = {
    draft: ['pending_approval'],
    pending_approval: ['approved', 'rejected'],
    approved: [], // Terminal state
    rejected: [], // Terminal state
  };

  return transitions[currentState] || [];
}

/**
 * Validate a state transition
 * 
 * Generic validation function that checks if a transition from one state to another is valid.
 * 
 * @param currentState - Current workflow state
 * @param nextState - Desired next state
 * @returns Validation result with error message if invalid
 * 
 * @example
 * ```typescript
 * const validation = validateStateTransition('draft', 'approved');
 * if (!validation.valid) {
 *   return res.status(400).json({ error: validation.error });
 * }
 * ```
 */
export function validateStateTransition(
  currentState: WorkflowState,
  nextState: WorkflowState
): ValidationResult {
  const validNextStates = getValidNextStates(currentState);

  if (validNextStates.includes(nextState)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `Invalid state transition from '${currentState}' to '${nextState}'. Valid next states: ${validNextStates.join(', ') || 'none (terminal state)'}.`,
  };
}
