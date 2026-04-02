/**
 * Skill Routes
 * Route definitions for skill endpoints
 * 
 * Requirements: 5.1, 5.3, 30.2
 */

import { Router } from 'express';
import { SkillController } from '../controllers/skill.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createSkillRoutes(skillController: SkillController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/skills
   * List skill records with pagination and filters
   */
  router.get('/', skillController.listSkills);

  /**
   * PUT /api/v1/admin/skills/:id
   * Update skill record by ID
   */
  router.put('/:id', skillController.updateSkill);

  /**
   * DELETE /api/v1/admin/skills/:id
   * Delete skill record by ID
   */
  router.delete('/:id', skillController.deleteSkill);

  return router;
}

/**
 * Create student-specific skill routes
 * Mounted at /api/v1/admin/students
 */
export function createStudentSkillRoutes(skillController: SkillController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/students/:studentId/skills
   * Get skill records by student ID
   */
  router.get('/:studentId/skills', skillController.getSkillsByStudent);

  /**
   * POST /api/v1/admin/students/:studentId/skills
   * Create a new skill record
   */
  router.post('/:studentId/skills', skillController.createSkill);

  return router;
}
