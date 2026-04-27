/**
 * RBAC Middleware Composition - Route Examples
 * 
 * This file demonstrates practical examples of middleware composition patterns
 * for different endpoint scenarios in the CCS Profiling System.
 * 
 * Patterns Demonstrated:
 * 1. Permission-Only: [requirePermission()]
 * 2. Permission + Ownership: [requirePermission(), checkOwnership()]
 * 3. Permission + Workflow: [requirePermission(), checkWorkflow()]
 * 4. Full Validation: [requirePermission(), checkOwnership(), checkWorkflow()]
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requirePermission, checkOwnership } from '../middleware';
import { Permission } from '../types';

const router = Router();
const emptyList: unknown[] = [];
const emptyResource: Record<string, never> = {};

// ============================================================================
// PATTERN 1: PERMISSION-ONLY CHECK
// ============================================================================
// Use for: Read operations, create operations, operations without ownership/workflow

/**
 * Example 1.1: Read all students
 * - Faculty can read all students
 * - No ownership check needed (reading collection)
 */
router.get('/students',
  requirePermission('student.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: fetch all students
      const students: unknown[] = emptyList; // await studentService.findAll();
      res.json(students);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 1.2: Read all schedules
 * - Multiple roles can read schedules
 * - No ownership check needed (public data)
 */
router.get('/schedules',
  requirePermission('schedule.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: fetch all schedules
      const schedules: unknown[] = emptyList; // await scheduleService.findAll();
      res.json(schedules);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 1.3: Create new student
 * - Secretary can create students
 * - No ownership check needed (no existing resource)
 */
router.post('/students',
  requirePermission('student.create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: create student
      const student = emptyResource; // await studentService.create(req.body);
      res.status(201).json(student);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 1.4: Multiple permissions (OR logic)
 * - User needs at least one of the specified permissions
 * - Useful for endpoints with multiple valid access paths
 */
router.post('/research',
  requirePermission(['research.create', 'research.submit']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: create research
      const research = emptyResource; // await researchService.create(req.body);
      res.status(201).json(research);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 1.5: Read analytics dashboard
 * - Admin and Department_Chair can view analytics
 * - No ownership check needed (role-based access)
 */
router.get('/analytics/dashboard',
  requirePermission('analytics.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: fetch analytics
      const analytics = emptyResource; // await analyticsService.getDashboard();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// PATTERN 2: PERMISSION + OWNERSHIP
// ============================================================================
// Use for: Update/delete operations on user-owned resources

/**
 * Example 2.1: Update instruction
 * - Faculty can update instructions
 * - Faculty can only update their own instructions
 * - Admin/Department_Chair bypass ownership check
 */
router.put('/instructions/:id',
  requirePermission('instruction.update'),
  checkOwnership('instruction'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: update instruction
      const instruction = emptyResource; // await instructionService.update(req.params.id, req.body);
      res.json(instruction);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 2.2: Delete research
 * - Faculty can delete research
 * - Faculty can only delete their own research
 * - Admin/Department_Chair bypass ownership check
 */
router.delete('/research/:id',
  requirePermission('research.delete'),
  checkOwnership('research'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: delete research
      // await researchService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 2.3: Update student profile
 * - Students can update their own profile
 * - Secretary can update any student profile
 * - Ownership check ensures students only update their own
 */
router.put('/students/:id/profile',
  requirePermission('student.update'),
  checkOwnership('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: update student profile
      const student = emptyResource; // await studentService.updateProfile(req.params.id, req.body);
      res.json(student);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 2.4: Custom parameter name
 * - Use when resource ID is not in req.params.id
 * - Specify paramName option to extract correct parameter
 */
router.put('/students/:studentId/academic-history',
  requirePermission('academic_history.update'),
  checkOwnership('student', { paramName: 'studentId' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: update academic history
      const history = emptyResource; // await academicHistoryService.update(req.params.studentId, req.body);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 2.5: Custom ownership field
 * - Use when ownership field is not the default
 * - Specify ownerField option to check correct field
 */
router.put('/enrollments/:id',
  requirePermission('enrollment.update'),
  checkOwnership('enrollment', { ownerField: 'student_id' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: update enrollment
      const enrollment = emptyResource; // await enrollmentService.update(req.params.id, req.body);
      res.json(enrollment);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 2.6: Read own data
 * - Students can read their own profile
 * - Ownership check ensures students only read their own
 */
router.get('/students/:id/profile',
  requirePermission('student.read_own'),
  checkOwnership('student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: fetch student profile
      const student = emptyResource; // await studentService.findById(req.params.id);
      res.json(student);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// PATTERN 3: PERMISSION + WORKFLOW (Future Implementation)
// ============================================================================
// Use for: Approval operations, state transitions, workflow-dependent operations

/**
 * Example 3.1: Approve schedule
 * - Department_Chair can approve schedules
 * - Schedule must be in pending_approval state
 * - No ownership check needed (approval is role-based)
 */
router.post('/schedules/:id/approve',
  requirePermission('schedule.approve'),
  // checkWorkflow('schedule'), // Future: validates pending_approval state
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: approve schedule
      const schedule = emptyResource; // await scheduleService.approve(req.params.id);
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 3.2: Submit research for approval
 * - Faculty can submit research
 * - Research must be in draft state
 * - No ownership check needed (submission is role-based)
 */
router.post('/research/:id/submit',
  requirePermission('research.submit'),
  // checkWorkflow('research'), // Future: validates draft state
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: submit research
      const research = emptyResource; // await researchService.submit(req.params.id);
      res.json(research);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 3.3: Reject event proposal
 * - Department_Chair can reject events
 * - Event must be in pending_approval state
 * - No ownership check needed (rejection is role-based)
 */
router.post('/events/:id/reject',
  requirePermission('event.reject'),
  // checkWorkflow('event'), // Future: validates pending_approval state
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: reject event
      const event = emptyResource; // await eventService.reject(req.params.id, req.body.reason);
      res.json(event);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 3.4: Publish schedule
 * - Department_Chair can publish schedules
 * - Schedule must be in approved state
 * - No ownership check needed (publishing is role-based)
 */
router.post('/schedules/:id/publish',
  requirePermission('schedule.publish'),
  // checkWorkflow('schedule'), // Future: validates approved state
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: publish schedule
      const schedule = emptyResource; // await scheduleService.publish(req.params.id);
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 3.5: Approve enrollment
 * - Department_Chair can approve enrollments
 * - Enrollment must be in pending_approval state
 * - No ownership check needed (approval is role-based)
 */
router.post('/enrollments/:id/approve',
  requirePermission('enrollment.approve'),
  // checkWorkflow('enrollment'), // Future: validates pending_approval state
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: approve enrollment
      const enrollment = emptyResource; // await enrollmentService.approve(req.params.id);
      res.json(enrollment);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// PATTERN 4: FULL VALIDATION (Permission + Ownership + Workflow)
// ============================================================================
// Use for: Complex operations requiring all three validations

/**
 * Example 4.1: Submit own research for approval
 * - Faculty can submit research
 * - Faculty can only submit their own research
 * - Research must be in draft state
 */
router.post('/research/:id/submit',
  requirePermission('research.submit'),
  checkOwnership('research'),
  // checkWorkflow('research'), // Future: validates draft state
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: submit research
      const research = emptyResource; // await researchService.submit(req.params.id);
      res.json(research);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 4.2: Update own instruction in draft state
 * - Faculty can update instructions
 * - Faculty can only update their own instructions
 * - Instruction must be in draft state (not approved)
 */
router.put('/instructions/:id/draft',
  requirePermission('instruction.update'),
  checkOwnership('instruction'),
  // checkWorkflow('instruction'), // Future: validates draft state
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: update instruction
      const instruction = emptyResource; // await instructionService.update(req.params.id, req.body);
      res.json(instruction);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 4.3: Withdraw own event proposal
 * - Faculty can withdraw events
 * - Faculty can only withdraw their own events
 * - Event must be in pending_approval state
 */
router.post('/events/:id/withdraw',
  requirePermission('event.withdraw'),
  checkOwnership('event'),
  // checkWorkflow('event'), // Future: validates pending_approval state
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: withdraw event
      const event = emptyResource; // await eventService.withdraw(req.params.id);
      res.json(event);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 4.4: Resubmit own rejected research
 * - Faculty can resubmit research
 * - Faculty can only resubmit their own research
 * - Research must be in rejected state
 */
router.post('/research/:id/resubmit',
  requirePermission('research.resubmit'),
  checkOwnership('research'),
  // checkWorkflow('research'), // Future: validates rejected state
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: resubmit research
      const research = emptyResource; // await researchService.resubmit(req.params.id, req.body);
      res.json(research);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 4.5: Update own schedule in draft state
 * - Secretary can update schedules
 * - Secretary can only update their own schedules
 * - Schedule must be in draft state (not submitted)
 */
router.put('/schedules/:id/draft',
  requirePermission('schedule.update'),
  checkOwnership('schedule'),
  // checkWorkflow('schedule'), // Future: validates draft state
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: update schedule
      const schedule = emptyResource; // await scheduleService.update(req.params.id, req.body);
      res.json(schedule);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// ADVANCED EXAMPLES
// ============================================================================

/**
 * Example 5.1: Conditional middleware composition
 * - Apply different middleware based on request context
 */
router.put('/students/:id',
  requirePermission('student.update'),
  (req: Request, res: Response, next: NextFunction) => {
    // Conditionally apply ownership check based on user role
    if (req.user?.role === 'student') {
      return checkOwnership('student')(req, res, next);
    }
    next();
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: update student
      const student = emptyResource; // await studentService.update(req.params.id, req.body);
      res.json(student);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 5.2: Multiple resource ownership checks
 * - Validate ownership of multiple related resources
 */
router.post('/students/:studentId/enrollments/:enrollmentId/approve',
  requirePermission('enrollment.approve'),
  checkOwnership('student', { paramName: 'studentId' }),
  checkOwnership('enrollment', { paramName: 'enrollmentId' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic: approve enrollment
      const enrollment = emptyResource; // await enrollmentService.approve(req.params.enrollmentId);
      res.json(enrollment);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 5.3: Type-safe permission constants
 * - Define permission constants for reusability and type safety
 */
const PERMISSIONS = {
  STUDENT_READ: 'student.read' as Permission,
  STUDENT_UPDATE: 'student.update' as Permission,
  STUDENT_DELETE: 'student.delete' as Permission,
  INSTRUCTION_CREATE: 'instruction.create' as Permission,
  INSTRUCTION_UPDATE: 'instruction.update' as Permission,
  INSTRUCTION_DELETE: 'instruction.delete' as Permission,
} as const;

router.get('/students',
  requirePermission(PERMISSIONS.STUDENT_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const students: unknown[] = emptyList; // await studentService.findAll();
      res.json(students);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 5.4: Middleware composition helper
 * - Create reusable middleware composition patterns
 */
function composeMiddleware(config: {
  permission: Permission | Permission[];
  ownership?: { resourceType: string; options?: any };
  workflow?: { resourceType: string };
}) {
  const middleware: ReturnType<typeof requirePermission>[] = [];

  middleware.push(requirePermission(config.permission));

  if (config.ownership) {
    middleware.push(checkOwnership(
      config.ownership.resourceType,
      config.ownership.options
    ));
  }

  // if (config.workflow) {
  //   middleware.push(checkWorkflow(config.workflow.resourceType));
  // }

  return middleware;
}

// Usage
router.put('/instructions/:id',
  ...composeMiddleware({
    permission: 'instruction.update',
    ownership: { resourceType: 'instruction' },
    // workflow: { resourceType: 'instruction' }
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instruction = emptyResource; // await instructionService.update(req.params.id, req.body);
      res.json(instruction);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Example 5.5: Error handling with middleware composition
 * - Demonstrate proper error handling in route handlers
 */
router.post('/research/:id/approve',
  requirePermission('research.approve'),
  // checkWorkflow('research'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Business logic with error handling
      const research = emptyResource; // await researchService.approve(req.params.id);
      
      if (!research) {
        return res.status(404).json({ error: 'Research not found' });
      }
      
      res.json(research);
    } catch (error) {
      // Pass errors to error handler middleware
      next(error);
    }
  }
);

export default router;
