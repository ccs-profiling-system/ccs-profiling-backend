/**
 * Instruction Controller Unit Tests
 * Tests for instruction HTTP request/response handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { InstructionController } from './instruction.controller';
import { InstructionService } from '../services/instruction.service';
import { ValidationError } from '../../../shared/errors';

// Mock service
const mockInstructionService = {
  getInstruction: vi.fn(),
  listInstructions: vi.fn(),
  createInstruction: vi.fn(),
  updateInstruction: vi.fn(),
  deleteInstruction: vi.fn(),
} as unknown as InstructionService;

describe('InstructionController', () => {
  let instructionController: InstructionController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    instructionController = new InstructionController(mockInstructionService);
    
    mockRequest = {
      params: {},
      query: {},
      body: {},
    };
    
    mockResponse = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };
    
    mockNext = vi.fn();
  });

  describe('getInstruction', () => {
    it('should return instruction successfully', async () => {
      const mockInstruction = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        subject_code: 'CS101',
        subject_name: 'Introduction to Programming',
        credits: 3,
        curriculum_year: '2023-2024',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      vi.mocked(mockInstructionService.getInstruction).mockResolvedValue(mockInstruction);

      await instructionController.getInstruction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockInstruction,
      });
    });

    it('should call next with error for invalid UUID', async () => {
      mockRequest.params = { id: 'invalid-uuid' };

      await instructionController.getInstruction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('createInstruction', () => {
    it('should create instruction successfully', async () => {
      const createData = {
        subject_code: 'CS101',
        subject_name: 'Introduction to Programming',
        credits: 3,
        curriculum_year: '2023-2024',
      };

      const mockCreatedInstruction = {
        id: '123',
        ...createData,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      mockRequest.body = createData;
      vi.mocked(mockInstructionService.createInstruction).mockResolvedValue(mockCreatedInstruction);

      await instructionController.createInstruction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedInstruction,
      });
    });

    it('should call next with error for invalid data', async () => {
      mockRequest.body = {
        subject_code: '', // Invalid: empty string
        credits: -1, // Invalid: negative
      };

      await instructionController.createInstruction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('listInstructions', () => {
    it('should return paginated list of instructions', async () => {
      const mockResult = {
        data: [
          {
            id: '123',
            subject_code: 'CS101',
            subject_name: 'Course 1',
            credits: 3,
            curriculum_year: '2023-2024',
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
      vi.mocked(mockInstructionService.listInstructions).mockResolvedValue(mockResult);

      await instructionController.listInstructions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.data,
        meta: mockResult.meta,
      });
    });
  });

  describe('updateInstruction', () => {
    it('should update instruction successfully', async () => {
      const updateData = {
        subject_name: 'Updated Course Name',
      };

      const mockUpdatedInstruction = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        subject_code: 'CS101',
        subject_name: 'Updated Course Name',
        credits: 3,
        curriculum_year: '2023-2024',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockRequest.body = updateData;
      vi.mocked(mockInstructionService.updateInstruction).mockResolvedValue(mockUpdatedInstruction);

      await instructionController.updateInstruction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedInstruction,
      });
    });
  });

  describe('deleteInstruction', () => {
    it('should delete instruction successfully', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      vi.mocked(mockInstructionService.deleteInstruction).mockResolvedValue(undefined);

      await instructionController.deleteInstruction(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Instruction deleted successfully',
        },
      });
    });
  });
});
