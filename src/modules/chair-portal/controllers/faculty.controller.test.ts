/**
 * Faculty Controller Unit Tests
 * Tests for faculty management HTTP request/response handling in chair portal
 * 
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { FacultyController } from './faculty.controller';
import { FacultyService } from '../services/faculty.service';
import { NotFoundError } from '../../../shared/errors';
import * as departmentScope from '../utils/departmentScope';

// Mock service
const mockFacultyService = {
  listFaculty: vi.fn(),
  getFacultyById: vi.fn(),
  getFacultyTeachingLoad: vi.fn(),
  getFacultyStats: vi.fn(),
} as unknown as FacultyService;

// Mock department scope utilities
vi.mock('../utils/departmentScope', () => ({
  extractDepartmentFromRequest: vi.fn(),
}));

describe('FacultyController', () => {
  let facultyController: FacultyController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    facultyController = new FacultyController(mockFacultyService);
    
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

  describe('listFaculty', () => {
    it('should return paginated list of faculty', async () => {
      const mockResult = {
        data: [
          {
            id: 'faculty-1',
            faculty_id: 'F2024001',
            user_id: 'user-1',
            first_name: 'Jane',
            last_name: 'Smith',
            middle_name: null,
            email: 'jane.smith@example.com',
            phone: '123-456-7890',
            department: 'Computer Science',
            position: 'Associate Professor',
            specialization: 'Machine Learning',
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
      vi.mocked(mockFacultyService.listFaculty).mockResolvedValue(mockResult);

      await facultyController.listFaculty(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFacultyService.listFaculty).toHaveBeenCalledWith('Computer Science', {
        page: 1,
        limit: 10,
        status: undefined,
        search: undefined,
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.data,
        meta: mockResult.meta,
      });
    });

    it('should handle filtering by status and search', async () => {
      const mockResult = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
        status: 'active',
        search: 'Smith',
      };
      vi.mocked(mockFacultyService.listFaculty).mockResolvedValue(mockResult);

      await facultyController.listFaculty(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFacultyService.listFaculty).toHaveBeenCalledWith('Computer Science', {
        page: 1,
        limit: 10,
        status: 'active',
        search: 'Smith',
      });
    });
  });

  describe('getFaculty', () => {
    it('should return faculty details', async () => {
      const mockFaculty = {
        id: 'faculty-1',
        faculty_id: 'F2024001',
        user_id: 'user-1',
        first_name: 'Jane',
        last_name: 'Smith',
        middle_name: null,
        email: 'jane.smith@example.com',
        phone: '123-456-7890',
        department: 'Computer Science',
        position: 'Associate Professor',
        specialization: 'Machine Learning',
        status: 'active',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      mockRequest.params = { id: 'faculty-1' };
      vi.mocked(mockFacultyService.getFacultyById).mockResolvedValue(mockFaculty);

      await facultyController.getFaculty(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFacultyService.getFacultyById).toHaveBeenCalledWith('faculty-1', 'Computer Science');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFaculty,
      });
    });

    it('should return 404 if faculty not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      vi.mocked(mockFacultyService.getFacultyById).mockResolvedValue(null);

      await facultyController.getFaculty(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getTeachingLoad', () => {
    it('should return faculty teaching load', async () => {
      const mockTeachingLoad = {
        faculty_id: 'faculty-1',
        faculty_name: 'Jane Smith',
        current_semester: '1st',
        current_academic_year: '2024-2025',
        schedules: [
          {
            id: 'schedule-1',
            schedule_type: 'class',
            room: 'Room 101',
            day: 'monday',
            start_time: '08:00:00',
            end_time: '10:00:00',
            semester: '1st',
            academic_year: '2024-2025',
          },
        ],
        total_schedules: 1,
      };

      mockRequest.params = { id: 'faculty-1' };
      vi.mocked(mockFacultyService.getFacultyTeachingLoad).mockResolvedValue(mockTeachingLoad);

      await facultyController.getTeachingLoad(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFacultyService.getFacultyTeachingLoad).toHaveBeenCalledWith('faculty-1', 'Computer Science');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTeachingLoad,
      });
    });

    it('should return 404 if faculty not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      vi.mocked(mockFacultyService.getFacultyTeachingLoad).mockResolvedValue(null);

      await facultyController.getTeachingLoad(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getFacultyStats', () => {
    it('should return faculty statistics', async () => {
      const mockStats = {
        faculty_id: 'faculty-1',
        faculty_name: 'Jane Smith',
        students_taught: 150,
        courses_taught: 5,
        research_count: 3,
      };

      mockRequest.params = { id: 'faculty-1' };
      vi.mocked(mockFacultyService.getFacultyStats).mockResolvedValue(mockStats);

      await facultyController.getFacultyStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFacultyService.getFacultyStats).toHaveBeenCalledWith('faculty-1', 'Computer Science');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should return 404 if faculty not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      vi.mocked(mockFacultyService.getFacultyStats).mockResolvedValue(null);

      await facultyController.getFacultyStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
});
