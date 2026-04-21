/**
 * Unit tests for workflow state validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateApprovalState,
  validateRejectionState,
  validateUpdateState,
  validateDeleteState,
  getValidNextStates,
  validateStateTransition,
} from './workflowValidation';
import { WorkflowState } from '../types';

describe('workflowValidation', () => {
  describe('validateApprovalState', () => {
    it('should allow approval when state is pending_approval', () => {
      const result = validateApprovalState('pending_approval');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject approval when state is draft', () => {
      const result = validateApprovalState('draft');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot approve a resource in draft state');
      expect(result.error).toContain('must be submitted for approval first');
    });

    it('should reject approval when state is already approved', () => {
      const result = validateApprovalState('approved');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already approved');
    });

    it('should reject approval when state is rejected', () => {
      const result = validateApprovalState('rejected');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('has been rejected');
      expect(result.error).toContain('Create a new submission');
    });
  });

  describe('validateRejectionState', () => {
    it('should allow rejection when state is pending_approval', () => {
      const result = validateRejectionState('pending_approval');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject rejection when state is draft', () => {
      const result = validateRejectionState('draft');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot reject a resource in draft state');
      expect(result.error).toContain('must be submitted for approval first');
    });

    it('should reject rejection when state is already approved', () => {
      const result = validateRejectionState('approved');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already approved');
      expect(result.error).toContain('reversal or cancellation');
    });

    it('should reject rejection when state is already rejected', () => {
      const result = validateRejectionState('rejected');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already been rejected');
    });
  });

  describe('validateUpdateState', () => {
    it('should allow update when state is draft', () => {
      const result = validateUpdateState('draft');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow update when state is pending_approval', () => {
      const result = validateUpdateState('pending_approval');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject update when state is approved', () => {
      const result = validateUpdateState('approved');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot update an approved resource');
      expect(result.error).toContain('immutable');
    });

    it('should reject update when state is rejected', () => {
      const result = validateUpdateState('rejected');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot update a rejected resource');
      expect(result.error).toContain('immutable');
    });
  });

  describe('validateDeleteState', () => {
    it('should allow deletion when state is draft', () => {
      const result = validateDeleteState('draft');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject deletion when state is pending_approval', () => {
      const result = validateDeleteState('pending_approval');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot delete a resource pending approval');
      expect(result.error).toContain('Reject the resource first');
    });

    it('should reject deletion when state is approved by default', () => {
      const result = validateDeleteState('approved');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot delete an approved resource');
      expect(result.error).toContain('immutable');
    });

    it('should allow deletion when state is approved and allowApprovedDeletion is true', () => {
      const result = validateDeleteState('approved', true);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject deletion when state is rejected', () => {
      const result = validateDeleteState('rejected');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot delete a rejected resource');
      expect(result.error).toContain('audit purposes');
    });
  });

  describe('getValidNextStates', () => {
    it('should return pending_approval as valid next state for draft', () => {
      const nextStates = getValidNextStates('draft');
      expect(nextStates).toEqual(['pending_approval']);
    });

    it('should return approved and rejected as valid next states for pending_approval', () => {
      const nextStates = getValidNextStates('pending_approval');
      expect(nextStates).toEqual(['approved', 'rejected']);
    });

    it('should return empty array for approved (terminal state)', () => {
      const nextStates = getValidNextStates('approved');
      expect(nextStates).toEqual([]);
    });

    it('should return empty array for rejected (terminal state)', () => {
      const nextStates = getValidNextStates('rejected');
      expect(nextStates).toEqual([]);
    });
  });

  describe('validateStateTransition', () => {
    it('should allow transition from draft to pending_approval', () => {
      const result = validateStateTransition('draft', 'pending_approval');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow transition from pending_approval to approved', () => {
      const result = validateStateTransition('pending_approval', 'approved');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow transition from pending_approval to rejected', () => {
      const result = validateStateTransition('pending_approval', 'rejected');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject transition from draft to approved', () => {
      const result = validateStateTransition('draft', 'approved');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid state transition');
      expect(result.error).toContain("from 'draft' to 'approved'");
      expect(result.error).toContain('pending_approval');
    });

    it('should reject transition from draft to rejected', () => {
      const result = validateStateTransition('draft', 'rejected');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid state transition');
      expect(result.error).toContain("from 'draft' to 'rejected'");
    });

    it('should reject transition from approved to any state', () => {
      const result = validateStateTransition('approved', 'pending_approval');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid state transition');
      expect(result.error).toContain('terminal state');
    });

    it('should reject transition from rejected to any state', () => {
      const result = validateStateTransition('rejected', 'approved');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid state transition');
      expect(result.error).toContain('terminal state');
    });
  });

  describe('edge cases and error messages', () => {
    it('should provide descriptive error messages for all invalid approval states', () => {
      const states: WorkflowState[] = ['draft', 'approved', 'rejected'];
      
      states.forEach(state => {
        const result = validateApprovalState(state);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.length).toBeGreaterThan(20); // Ensure descriptive message
      });
    });

    it('should provide descriptive error messages for all invalid rejection states', () => {
      const states: WorkflowState[] = ['draft', 'approved', 'rejected'];
      
      states.forEach(state => {
        const result = validateRejectionState(state);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.length).toBeGreaterThan(20); // Ensure descriptive message
      });
    });

    it('should provide descriptive error messages for all invalid update states', () => {
      const states: WorkflowState[] = ['approved', 'rejected'];
      
      states.forEach(state => {
        const result = validateUpdateState(state);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.length).toBeGreaterThan(20); // Ensure descriptive message
      });
    });

    it('should handle all workflow states consistently', () => {
      const allStates: WorkflowState[] = ['draft', 'pending_approval', 'approved', 'rejected'];
      
      allStates.forEach(state => {
        // All validation functions should handle all states without throwing
        expect(() => validateApprovalState(state)).not.toThrow();
        expect(() => validateRejectionState(state)).not.toThrow();
        expect(() => validateUpdateState(state)).not.toThrow();
        expect(() => validateDeleteState(state)).not.toThrow();
        expect(() => getValidNextStates(state)).not.toThrow();
      });
    });
  });

  describe('integration scenarios', () => {
    it('should validate complete approval workflow: draft -> pending -> approved', () => {
      // Start in draft
      let currentState: WorkflowState = 'draft';
      
      // Cannot approve draft
      expect(validateApprovalState(currentState).valid).toBe(false);
      
      // Transition to pending_approval
      expect(validateStateTransition(currentState, 'pending_approval').valid).toBe(true);
      currentState = 'pending_approval';
      
      // Can approve pending_approval
      expect(validateApprovalState(currentState).valid).toBe(true);
      
      // Transition to approved
      expect(validateStateTransition(currentState, 'approved').valid).toBe(true);
      currentState = 'approved';
      
      // Cannot approve again
      expect(validateApprovalState(currentState).valid).toBe(false);
      
      // Cannot update approved
      expect(validateUpdateState(currentState).valid).toBe(false);
    });

    it('should validate complete rejection workflow: draft -> pending -> rejected', () => {
      // Start in draft
      let currentState: WorkflowState = 'draft';
      
      // Cannot reject draft
      expect(validateRejectionState(currentState).valid).toBe(false);
      
      // Transition to pending_approval
      expect(validateStateTransition(currentState, 'pending_approval').valid).toBe(true);
      currentState = 'pending_approval';
      
      // Can reject pending_approval
      expect(validateRejectionState(currentState).valid).toBe(true);
      
      // Transition to rejected
      expect(validateStateTransition(currentState, 'rejected').valid).toBe(true);
      currentState = 'rejected';
      
      // Cannot reject again
      expect(validateRejectionState(currentState).valid).toBe(false);
      
      // Cannot update rejected
      expect(validateUpdateState(currentState).valid).toBe(false);
    });

    it('should validate event deletion workflow with approved cancellation', () => {
      // Draft can be deleted
      expect(validateDeleteState('draft').valid).toBe(true);
      
      // Pending cannot be deleted
      expect(validateDeleteState('pending_approval').valid).toBe(false);
      
      // Approved cannot be deleted by default
      expect(validateDeleteState('approved').valid).toBe(false);
      
      // Approved can be deleted (cancelled) when explicitly allowed
      expect(validateDeleteState('approved', true).valid).toBe(true);
    });
  });
});
