/**
 * Skill Routes
 * Route definitions for skill endpoints
 * 
 */

import { Router } from 'express';
import { SkillController } from '../controllers/skill.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createSkillRoutes(skillController: SkillController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/skills
   * List skill records with pagination and filters
   * 
   * Permission: skill.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('skill.read'), skillController.listSkills);

  /**
   * PUT /api/v1/admin/skills/:id
   * Update skill record by ID
   * 
   * Permission: skill.update
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.put('/:id', requirePermission('skill.update'), skillController.updateSkill);

  /**
   * DELETE /api/v1/admin/skills/:id
   * Delete skill record by ID
   * 
   * Permission: skill.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('skill.delete'), skillController.deleteSkill);

  return router;
}

/**
 * Create student-specific skill routes
 * Mounted at /api/v1/admin/students
 */
export function createStudentSkillRoutes(skillController: SkillController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/students/:studentId/skills
   * Get skill records by student ID
   * 
   * Permission: skill.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:studentId/skills', requirePermission('skill.read'), skillController.getSkillsByStudent);

  /**
   * POST /api/v1/admin/students/:studentId/skills
   * Create a new skill record
   * 
   * Permission: skill.create
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.post('/:studentId/skills', requirePermission('skill.create'), skillController.createSkill);

  return router;
}
