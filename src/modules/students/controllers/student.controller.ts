/**
 * Student Controller
 * HTTP request/response handling for student operations
 * 
 * Requirements: 2.1, 2.5, 2.6, 2.7, 4.7, 4.8, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { ValidationError } from '../../../shared/errors';
import {
  createStudentSchema,
  updateStudentSchema,
  studentIdParamSchema,
  studentListQuerySchema,
} from '../schemas/student.schema';

export class StudentController {
  constructor(private studentService: StudentService) {}

  /**
   * GET /api/v1/admin/students
   * List students with pagination, search, and filters
   * Requirements: 2.5, 30.2
   */
  listStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = studentListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.studentService.listStudents(filters);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/students/:id
   * Get student by ID
   * Requirements: 2.5, 30.2
   */
  getStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = studentIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid student ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const student = await this.studentService.getStudent(id);

      res.json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/students
   * Create a new student
   * Requirements: 2.1, 4.7, 30.2
   */
  createStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = createStudentSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const data = validationResult.data;

      const student = await this.studentService.createStudent(data);

      res.status(201).json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/students/:id
   * Update student by ID
   * Requirements: 2.6, 4.7, 30.2
   */
  updateStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = studentIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid student ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateStudentSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const student = await this.studentService.updateStudent(id, data);

      res.json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/students/:id
   * Soft delete student by ID
   * Requirements: 2.7, 4.7, 30.2
   */
  deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = studentIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid student ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.studentService.deleteStudent(id);

      res.json({
        success: true,
        data: {
          message: 'Student deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/students/:id/profile
   * Get complete student profile with aggregated data
   * Returns aggregated profile within 500ms
   * Requirements: 10.1, 10.4, 30.2
   */
  getStudentProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = studentIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid student ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const profile = await this.studentService.getStudentProfile(id);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };
}
