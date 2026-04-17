/**
 * Student Controller Unit Tests
 * Tests for student management HTTP request/response handling in chair portal
 * 
 * Requirements: 3.1, 3.5, 3.8, 3.12, 9.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { StudentController } from './student.controller';
import { StudentService } from '../services/student.service';
import { ValidationError, NotFoundError } from '../../../shared/errors';
import * as departmentScope from '../utils/departmentScope';

// Mock service
const mockStudentService = {
  listStudents: vi.fn(),
  getStudentById: vi.fn(),
  approveStudent: vi.fn(),
  rejectStudent: vi.fn(),
} as unknown as StudentService;

// Mock department scope utilities
vi.mock('../utils/departmentScope', () => ({
  extractDepartmentFromRequest: vi.fn(),
}));

describe('StudentController', () => {
  let studentController: StudentController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    studentController = new StudentController(mockStudentService);
    
    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: {
        userId: 'user-123',
        email: 'chair@example.com',
        role: 'department_chair',
      },
    };
    
    mockResponse = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };
    
    mockNext = vi.fn();

    // Mock department extraction
    vi.mocked(departmentScope.extractDepartmentFromRequest).mockResolvedValue({
      departmentId: 'Computer Science',
      facultyId: 'faculty-123',
      facultyName: 'John Doe',
    });
  });

  describe('listStudents', () => {
    it('should return paginated list of students', async () => {
      const mockResult = {
        data: [
          {
            id: 'student-1',
            student_id: 'S2024001',
            user_id: 'user-1',
            first_name: 'Jane',
            last_name: 'Doe',
            middle_name: null,
            email: 'jane@example.com',
            phone: null,
            date_of_birth: null,
            address: null,
            year_level: 1,
            program: 'Computer Science',
            status: 'active',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockRequest.query = { page: '1', limit: '10' };
      vi.mocked(mockStudentService.listStudents).mockResolvedValue(mockResult);

      await studentController.listStudents(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStudentService.listStudents).toHaveBeenCalledWith('Computer Science', {
        page: 1,
        limit: 10,
        status: undefined,
        year_level: undefined,
        search: undefined,
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.data,
        meta: mockResult.meta,
      });
    });

    it('should handle filtering by status and year_level', async () => {
      const mockResult = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
        status: 'pending_approval',
        year_level: '2',
      };
      vi.mocked(mockStudentService.listStudents).mockResolvedValue(mockResult);

      await studentController.listStudents(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStudentService.listStudents).toHaveBeenCalledWith('Computer Science', {
        page: 1,
        limit: 10,
        status: 'pending_approval',
        year_level: 2,
        search: undefined,
      });
    });
  });

  describe('getStudent', () => {
    it('should return student details', async () => {
      const mockStudent = {
        id: 'student-1',
        student_id: 'S2024001',
        user_id: 'user-1',
        first_name: 'Jane',
        last_name: 'Doe',
        middle_name: null,
        email: 'jane@example.com',
        phone: null,
        date_of_birth: null,
        address: null,
        year_level: 1,
        program: 'Computer Science',
        status: 'active',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      mockRequest.params = { id: 'student-1' };
      vi.mocked(mockStudentService.getStudentById).mockResolvedValue(mockStudent);

      await studentController.getStudent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStudentService.getStudentById).toHaveBeenCalledWith('student-1', 'Computer Science');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStudent,
      });
    });

    it('should return 404 if student not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      vi.mocked(mockStudentService.getStudentById).mockResolvedValue(null);

      await studentController.getStudent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('approveStudent', () => {
    it('should approve student successfully', async () => {
      const mockStudent = {
        id: 'student-1',
        student_id: 'S2024001',
        user_id: 'user-1',
        first_name: 'Jane',
        last_name: 'Doe',
        middle_name: null,
        email: 'jane@example.com',
        phone: null,
        date_of_birth: null,
        address: null,
        year_level: 1,
        program: 'Computer Science',
        status: 'approved',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      mockRequest.params = { id: 'student-1' };
      mockRequest.body = { approver_notes: 'Approved for enrollment' };
      vi.mocked(mockStudentService.approveStudent).mockResolvedValue(mockStudent);

      await studentController.approveStudent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStudentService.approveStudent).toHaveBeenCalledWith(
        'student-1',
        'Computer Science',
        { approver_notes: 'Approved for enrollment' },
        'user-123'
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStudent,
        message: 'Student approved successfully',
      });
    });

    it('should return 400 if student is not in valid state for approval', async () => {
      mockRequest.params = { id: 'student-1' };
      mockRequest.body = {};
      
      const error = new Error('Cannot approve a resource in draft state. The resource must be submitted for approval first.');
      vi.mocked(mockStudentService.approveStudent).mockRejectedValue(error);

      await studentController.approveStudent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('rejectStudent', () => {
    it('should reject student successfully', async () => {
      const mockStudent = {
        id: 'student-1',
        student_id: 'S2024001',
        user_id: 'user-1',
        first_name: 'Jane',
        last_name: 'Doe',
        middle_name: null,
        email: 'jane@example.com',
        phone: null,
        date_of_birth: null,
        address: null,
        year_level: 1,
        program: 'Computer Science',
        status: 'rejected',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      mockRequest.params = { id: 'student-1' };
      mockRequest.body = { rejection_reason: 'Incomplete documentation provided' };
      vi.mocked(mockStudentService.rejectStudent).mockResolvedValue(mockStudent);

      await studentController.rejectStudent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStudentService.rejectStudent).toHaveBeenCalledWith(
        'student-1',
        'Computer Science',
        { rejection_reason: 'Incomplete documentation provided' },
        'user-123'
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStudent,
        message: 'Student rejected successfully',
      });
    });

    it('should return 400 if rejection_reason is missing', async () => {
      mockRequest.params = { id: 'student-1' };
      mockRequest.body = {};

      await studentController.rejectStudent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should return 400 if rejection_reason is too short', async () => {
      mockRequest.params = { id: 'student-1' };
      mockRequest.body = { rejection_reason: 'Too short' };

      await studentController.rejectStudent(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });
});
