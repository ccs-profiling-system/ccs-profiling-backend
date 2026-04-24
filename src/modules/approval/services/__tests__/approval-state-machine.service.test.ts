import { describe, it, expect } from 'vitest';
import {
  ApprovalStateMachineService,
  InvalidStateTransitionError,
  approvalStateMachine,
} from '../approval-state-machine.service';
import { ApprovalStatus } from '../../../../db/schema/approvals';

describe('ApprovalStateMachineService', () => {
  let stateMachine: ApprovalStateMachineService;

  beforeEach(() => {
    stateMachine = new ApprovalStateMachineService();
  });

  describe('validateTransition', () => {
    describe('valid transitions from draft', () => {
      it('should allow draft → pending', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.DRAFT, ApprovalStatus.PENDING)).toBe(true);
      });

      it('should allow draft → draft (no-op)', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.DRAFT, ApprovalStatus.DRAFT)).toBe(true);
      });
    });

    describe('invalid transitions from draft', () => {
      it('should reject draft → approved', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.DRAFT, ApprovalStatus.APPROVED)).toBe(false);
      });

      it('should reject draft → rejected', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.DRAFT, ApprovalStatus.REJECTED)).toBe(false);
      });

      it('should reject draft → withdrawn', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.DRAFT, ApprovalStatus.WITHDRAWN)).toBe(false);
      });

      it('should reject draft → conflicted', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.DRAFT, ApprovalStatus.CONFLICTED)).toBe(false);
      });

      it('should reject draft → failed', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.DRAFT, ApprovalStatus.FAILED)).toBe(false);
      });
    });

    describe('valid transitions from pending', () => {
      it('should allow pending → approved', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.PENDING, ApprovalStatus.APPROVED)).toBe(true);
      });

      it('should allow pending → rejected', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.PENDING, ApprovalStatus.REJECTED)).toBe(true);
      });

      it('should allow pending → withdrawn', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.PENDING, ApprovalStatus.WITHDRAWN)).toBe(true);
      });

      it('should allow pending → conflicted', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.PENDING, ApprovalStatus.CONFLICTED)).toBe(true);
      });

      it('should allow pending → failed', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.PENDING, ApprovalStatus.FAILED)).toBe(true);
      });

      it('should allow pending → pending (no-op)', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.PENDING, ApprovalStatus.PENDING)).toBe(true);
      });
    });

    describe('invalid transitions from pending', () => {
      it('should reject pending → draft', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.PENDING, ApprovalStatus.DRAFT)).toBe(false);
      });
    });

    describe('valid transitions from conflicted', () => {
      it('should allow conflicted → pending', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.CONFLICTED, ApprovalStatus.PENDING)).toBe(true);
      });

      it('should allow conflicted → conflicted (no-op)', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.CONFLICTED, ApprovalStatus.CONFLICTED)).toBe(true);
      });
    });

    describe('invalid transitions from conflicted', () => {
      it('should reject conflicted → approved', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.CONFLICTED, ApprovalStatus.APPROVED)).toBe(false);
      });

      it('should reject conflicted → rejected', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.CONFLICTED, ApprovalStatus.REJECTED)).toBe(false);
      });

      it('should reject conflicted → withdrawn', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.CONFLICTED, ApprovalStatus.WITHDRAWN)).toBe(false);
      });

      it('should reject conflicted → failed', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.CONFLICTED, ApprovalStatus.FAILED)).toBe(false);
      });

      it('should reject conflicted → draft', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.CONFLICTED, ApprovalStatus.DRAFT)).toBe(false);
      });
    });

    describe('valid transitions from failed', () => {
      it('should allow failed → pending', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.FAILED, ApprovalStatus.PENDING)).toBe(true);
      });

      it('should allow failed → failed (no-op)', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.FAILED, ApprovalStatus.FAILED)).toBe(true);
      });
    });

    describe('invalid transitions from failed', () => {
      it('should reject failed → approved', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.FAILED, ApprovalStatus.APPROVED)).toBe(false);
      });

      it('should reject failed → rejected', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.FAILED, ApprovalStatus.REJECTED)).toBe(false);
      });

      it('should reject failed → withdrawn', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.FAILED, ApprovalStatus.WITHDRAWN)).toBe(false);
      });

      it('should reject failed → conflicted', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.FAILED, ApprovalStatus.CONFLICTED)).toBe(false);
      });

      it('should reject failed → draft', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.FAILED, ApprovalStatus.DRAFT)).toBe(false);
      });
    });

    describe('final states (approved, rejected, withdrawn)', () => {
      it('should reject approved → any other state', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.APPROVED, ApprovalStatus.PENDING)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.APPROVED, ApprovalStatus.REJECTED)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.APPROVED, ApprovalStatus.WITHDRAWN)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.APPROVED, ApprovalStatus.CONFLICTED)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.APPROVED, ApprovalStatus.FAILED)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.APPROVED, ApprovalStatus.DRAFT)).toBe(false);
      });

      it('should allow approved → approved (no-op)', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.APPROVED, ApprovalStatus.APPROVED)).toBe(true);
      });

      it('should reject rejected → any other state', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.REJECTED, ApprovalStatus.PENDING)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.REJECTED, ApprovalStatus.APPROVED)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.REJECTED, ApprovalStatus.WITHDRAWN)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.REJECTED, ApprovalStatus.CONFLICTED)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.REJECTED, ApprovalStatus.FAILED)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.REJECTED, ApprovalStatus.DRAFT)).toBe(false);
      });

      it('should allow rejected → rejected (no-op)', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.REJECTED, ApprovalStatus.REJECTED)).toBe(true);
      });

      it('should reject withdrawn → any other state', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.WITHDRAWN, ApprovalStatus.PENDING)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.WITHDRAWN, ApprovalStatus.APPROVED)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.WITHDRAWN, ApprovalStatus.REJECTED)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.WITHDRAWN, ApprovalStatus.CONFLICTED)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.WITHDRAWN, ApprovalStatus.FAILED)).toBe(false);
        expect(stateMachine.validateTransition(ApprovalStatus.WITHDRAWN, ApprovalStatus.DRAFT)).toBe(false);
      });

      it('should allow withdrawn → withdrawn (no-op)', () => {
        expect(stateMachine.validateTransition(ApprovalStatus.WITHDRAWN, ApprovalStatus.WITHDRAWN)).toBe(true);
      });
    });
  });

  describe('getAllowedNextStates', () => {
    it('should return [pending] for draft', () => {
      const allowed = stateMachine.getAllowedNextStates(ApprovalStatus.DRAFT);
      expect(allowed).toEqual([ApprovalStatus.PENDING]);
    });

    it('should return [approved, rejected, withdrawn, conflicted, failed] for pending', () => {
      const allowed = stateMachine.getAllowedNextStates(ApprovalStatus.PENDING);
      expect(allowed).toEqual([
        ApprovalStatus.APPROVED,
        ApprovalStatus.REJECTED,
        ApprovalStatus.WITHDRAWN,
        ApprovalStatus.CONFLICTED,
        ApprovalStatus.FAILED,
      ]);
    });

    it('should return [pending] for conflicted', () => {
      const allowed = stateMachine.getAllowedNextStates(ApprovalStatus.CONFLICTED);
      expect(allowed).toEqual([ApprovalStatus.PENDING]);
    });

    it('should return [pending] for failed', () => {
      const allowed = stateMachine.getAllowedNextStates(ApprovalStatus.FAILED);
      expect(allowed).toEqual([ApprovalStatus.PENDING]);
    });

    it('should return empty array for approved (final state)', () => {
      const allowed = stateMachine.getAllowedNextStates(ApprovalStatus.APPROVED);
      expect(allowed).toEqual([]);
    });

    it('should return empty array for rejected (final state)', () => {
      const allowed = stateMachine.getAllowedNextStates(ApprovalStatus.REJECTED);
      expect(allowed).toEqual([]);
    });

    it('should return empty array for withdrawn (final state)', () => {
      const allowed = stateMachine.getAllowedNextStates(ApprovalStatus.WITHDRAWN);
      expect(allowed).toEqual([]);
    });
  });

  describe('assertValidTransition', () => {
    it('should not throw for valid transitions', () => {
      expect(() => {
        stateMachine.assertValidTransition(ApprovalStatus.DRAFT, ApprovalStatus.PENDING);
      }).not.toThrow();

      expect(() => {
        stateMachine.assertValidTransition(ApprovalStatus.PENDING, ApprovalStatus.APPROVED);
      }).not.toThrow();

      expect(() => {
        stateMachine.assertValidTransition(ApprovalStatus.CONFLICTED, ApprovalStatus.PENDING);
      }).not.toThrow();

      expect(() => {
        stateMachine.assertValidTransition(ApprovalStatus.FAILED, ApprovalStatus.PENDING);
      }).not.toThrow();
    });

    it('should throw InvalidStateTransitionError for invalid transitions', () => {
      expect(() => {
        stateMachine.assertValidTransition(ApprovalStatus.DRAFT, ApprovalStatus.APPROVED);
      }).toThrow(InvalidStateTransitionError);

      expect(() => {
        stateMachine.assertValidTransition(ApprovalStatus.APPROVED, ApprovalStatus.PENDING);
      }).toThrow(InvalidStateTransitionError);

      expect(() => {
        stateMachine.assertValidTransition(ApprovalStatus.CONFLICTED, ApprovalStatus.APPROVED);
      }).toThrow(InvalidStateTransitionError);
    });

    it('should include current and new status in error message', () => {
      try {
        stateMachine.assertValidTransition(ApprovalStatus.APPROVED, ApprovalStatus.PENDING);
        expect.fail('Should have thrown InvalidStateTransitionError');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidStateTransitionError);
        expect((error as InvalidStateTransitionError).currentStatus).toBe(ApprovalStatus.APPROVED);
        expect((error as InvalidStateTransitionError).newStatus).toBe(ApprovalStatus.PENDING);
        expect((error as Error).message).toContain('approved');
        expect((error as Error).message).toContain('pending');
      }
    });

    it('should include allowed transitions in error message', () => {
      try {
        stateMachine.assertValidTransition(ApprovalStatus.DRAFT, ApprovalStatus.APPROVED);
        expect.fail('Should have thrown InvalidStateTransitionError');
      } catch (error) {
        expect((error as Error).message).toContain('pending');
      }
    });

    it('should indicate final state in error message when no transitions allowed', () => {
      try {
        stateMachine.assertValidTransition(ApprovalStatus.APPROVED, ApprovalStatus.REJECTED);
        expect.fail('Should have thrown InvalidStateTransitionError');
      } catch (error) {
        expect((error as Error).message).toContain('final state');
      }
    });
  });

  describe('isFinalState', () => {
    it('should return true for approved', () => {
      expect(stateMachine.isFinalState(ApprovalStatus.APPROVED)).toBe(true);
    });

    it('should return true for rejected', () => {
      expect(stateMachine.isFinalState(ApprovalStatus.REJECTED)).toBe(true);
    });

    it('should return true for withdrawn', () => {
      expect(stateMachine.isFinalState(ApprovalStatus.WITHDRAWN)).toBe(true);
    });

    it('should return false for draft', () => {
      expect(stateMachine.isFinalState(ApprovalStatus.DRAFT)).toBe(false);
    });

    it('should return false for pending', () => {
      expect(stateMachine.isFinalState(ApprovalStatus.PENDING)).toBe(false);
    });

    it('should return false for conflicted', () => {
      expect(stateMachine.isFinalState(ApprovalStatus.CONFLICTED)).toBe(false);
    });

    it('should return false for failed', () => {
      expect(stateMachine.isFinalState(ApprovalStatus.FAILED)).toBe(false);
    });
  });

  describe('canRetry', () => {
    it('should return true for failed status', () => {
      expect(stateMachine.canRetry(ApprovalStatus.FAILED)).toBe(true);
    });

    it('should return false for all other statuses', () => {
      expect(stateMachine.canRetry(ApprovalStatus.DRAFT)).toBe(false);
      expect(stateMachine.canRetry(ApprovalStatus.PENDING)).toBe(false);
      expect(stateMachine.canRetry(ApprovalStatus.APPROVED)).toBe(false);
      expect(stateMachine.canRetry(ApprovalStatus.REJECTED)).toBe(false);
      expect(stateMachine.canRetry(ApprovalStatus.WITHDRAWN)).toBe(false);
      expect(stateMachine.canRetry(ApprovalStatus.CONFLICTED)).toBe(false);
    });
  });

  describe('canWithdraw', () => {
    it('should return true for pending status', () => {
      expect(stateMachine.canWithdraw(ApprovalStatus.PENDING)).toBe(true);
    });

    it('should return false for all other statuses', () => {
      expect(stateMachine.canWithdraw(ApprovalStatus.DRAFT)).toBe(false);
      expect(stateMachine.canWithdraw(ApprovalStatus.APPROVED)).toBe(false);
      expect(stateMachine.canWithdraw(ApprovalStatus.REJECTED)).toBe(false);
      expect(stateMachine.canWithdraw(ApprovalStatus.WITHDRAWN)).toBe(false);
      expect(stateMachine.canWithdraw(ApprovalStatus.CONFLICTED)).toBe(false);
      expect(stateMachine.canWithdraw(ApprovalStatus.FAILED)).toBe(false);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(approvalStateMachine).toBeInstanceOf(ApprovalStateMachineService);
    });

    it('should work the same as a new instance', () => {
      expect(approvalStateMachine.validateTransition(ApprovalStatus.DRAFT, ApprovalStatus.PENDING)).toBe(true);
      expect(approvalStateMachine.getAllowedNextStates(ApprovalStatus.PENDING)).toEqual([
        ApprovalStatus.APPROVED,
        ApprovalStatus.REJECTED,
        ApprovalStatus.WITHDRAWN,
        ApprovalStatus.CONFLICTED,
        ApprovalStatus.FAILED,
      ]);
    });
  });
});
