import { ApprovalStatus, ApprovalStatusType } from '../../../db/schema/approvals';

/**
 * State Machine Service for Approval Workflow
 * 
 * Manages state transitions for the approval workflow system.
 * Enforces valid state transitions and provides utilities for workflow management.
 * 
 * Allowed transitions:
 * - draft → pending
 * - pending → approved | rejected | withdrawn | conflicted | failed
 * - conflicted → pending
 * - failed → pending
 * - approved, rejected, withdrawn → (final states, no transitions)
 */

/**
 * Defines all allowed state transitions in the approval workflow
 */
const ALLOWED_TRANSITIONS: Record<ApprovalStatusType, ApprovalStatusType[]> = {
  [ApprovalStatus.DRAFT]: [ApprovalStatus.PENDING],
  [ApprovalStatus.PENDING]: [
    ApprovalStatus.APPROVED,
    ApprovalStatus.REJECTED,
    ApprovalStatus.WITHDRAWN,
    ApprovalStatus.CONFLICTED,
    ApprovalStatus.FAILED,
  ],
  [ApprovalStatus.CONFLICTED]: [ApprovalStatus.PENDING],
  [ApprovalStatus.FAILED]: [ApprovalStatus.PENDING],
  [ApprovalStatus.APPROVED]: [],
  [ApprovalStatus.REJECTED]: [],
  [ApprovalStatus.WITHDRAWN]: [],
};

/**
 * Error thrown when an invalid state transition is attempted
 */
export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly currentStatus: ApprovalStatusType,
    public readonly newStatus: ApprovalStatusType
  ) {
    super(
      `Invalid state transition from '${currentStatus}' to '${newStatus}'. ` +
      `Allowed transitions from '${currentStatus}': ${ALLOWED_TRANSITIONS[currentStatus].join(', ') || 'none (final state)'}`
    );
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * Service for managing approval workflow state transitions
 */
export class ApprovalStateMachineService {
  /**
   * Validates whether a state transition is allowed
   * 
   * @param currentStatus - The current status of the approval
   * @param newStatus - The desired new status
   * @returns true if the transition is valid, false otherwise
   * 
   * @example
   * ```typescript
   * const stateMachine = new ApprovalStateMachineService();
   * stateMachine.validateTransition('pending', 'approved'); // true
   * stateMachine.validateTransition('approved', 'rejected'); // false
   * ```
   */
  validateTransition(
    currentStatus: ApprovalStatusType,
    newStatus: ApprovalStatusType
  ): boolean {
    // Same status is always valid (no-op)
    if (currentStatus === newStatus) {
      return true;
    }

    const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus];
    
    if (!allowedNextStates) {
      return false;
    }

    return allowedNextStates.includes(newStatus);
  }

  /**
   * Gets all allowed next states for a given current status
   * 
   * @param currentStatus - The current status of the approval
   * @returns Array of valid next states
   * 
   * @example
   * ```typescript
   * const stateMachine = new ApprovalStateMachineService();
   * stateMachine.getAllowedNextStates('pending'); 
   * // Returns: ['approved', 'rejected', 'withdrawn', 'conflicted', 'failed']
   * ```
   */
  getAllowedNextStates(currentStatus: ApprovalStatusType): ApprovalStatusType[] {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Validates a state transition and throws an error if invalid
   * 
   * @param currentStatus - The current status of the approval
   * @param newStatus - The desired new status
   * @throws {InvalidStateTransitionError} If the transition is not allowed
   * 
   * @example
   * ```typescript
   * const stateMachine = new ApprovalStateMachineService();
   * stateMachine.assertValidTransition('pending', 'approved'); // OK
   * stateMachine.assertValidTransition('approved', 'rejected'); // Throws InvalidStateTransitionError
   * ```
   */
  assertValidTransition(
    currentStatus: ApprovalStatusType,
    newStatus: ApprovalStatusType
  ): void {
    if (!this.validateTransition(currentStatus, newStatus)) {
      throw new InvalidStateTransitionError(currentStatus, newStatus);
    }
  }

  /**
   * Checks if a status is a final state (no further transitions allowed)
   * 
   * @param status - The status to check
   * @returns true if the status is final, false otherwise
   * 
   * @example
   * ```typescript
   * const stateMachine = new ApprovalStateMachineService();
   * stateMachine.isFinalState('approved'); // true
   * stateMachine.isFinalState('pending'); // false
   * ```
   */
  isFinalState(status: ApprovalStatusType): boolean {
    return ALLOWED_TRANSITIONS[status].length === 0;
  }

  /**
   * Checks if a status allows retry operations
   * 
   * @param status - The status to check
   * @returns true if retry is allowed from this status
   * 
   * @example
   * ```typescript
   * const stateMachine = new ApprovalStateMachineService();
   * stateMachine.canRetry('failed'); // true
   * stateMachine.canRetry('approved'); // false
   * ```
   */
  canRetry(status: ApprovalStatusType): boolean {
    return status === ApprovalStatus.FAILED;
  }

  /**
   * Checks if a status allows withdrawal
   * 
   * @param status - The status to check
   * @returns true if withdrawal is allowed from this status
   * 
   * @example
   * ```typescript
   * const stateMachine = new ApprovalStateMachineService();
   * stateMachine.canWithdraw('pending'); // true
   * stateMachine.canWithdraw('approved'); // false
   * ```
   */
  canWithdraw(status: ApprovalStatusType): boolean {
    return status === ApprovalStatus.PENDING;
  }
}

// Export singleton instance for convenience
export const approvalStateMachine = new ApprovalStateMachineService();
