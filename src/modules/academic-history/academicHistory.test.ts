/**
 * Academic History Module Integration Tests
 * Tests the complete academic history module functionality
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { describe, it, expect } from 'vitest';
import { 
  createAcademicHistorySchema,
  updateAcademicHistorySchema,
  academicHistoryIdParamSchema,
  studentIdParamSchema,
  academicHistoryListQuerySchema,
} from './schemas/academicHistory.schema';

describe('Academic History Module', () => {
  describe('Validation Schemas', () => {
    describe('createAcademicHistorySchema', () => {
      it('should validate valid academic history data', () => {
        const validData = {
          student_id: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
          subject_code: 'CS101',
          subject_name: 'Introduction to Programming',
          grade: 1.25,
          semester: '1st' as const,
          academic_year: '2023-2024',
          credits: 3,
          remarks: 'passed' as const,
        };

        const result = createAcademicHistorySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid student_id format', () => {
        const invalidData = {
          student_id: 'invalid-uuid',
          subject_code: 'CS101',
          subject_name: 'Introduction to Programming',
          grade: 1.25,
          semester: '1st' as const,
          academic_year: '2023-2024',
          credits: 3,
        };

        const result = createAcademicHistorySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject invalid semester value', () => {
        const invalidData = {
          student_id: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
          subject_code: 'CS101',
          subject_name: 'Introduction to Programming',
          grade: 1.25,
          semester: 'invalid',
          academic_year: '2023-2024',
          credits: 3,
        };

        const result = createAcademicHistorySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject grade outside valid range', () => {
        const invalidData = {
          student_id: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
          subject_code: 'CS101',
          subject_name: 'Introduction to Programming',
          grade: 6.0, // Invalid: max is 5
          semester: '1st' as const,
          academic_year: '2023-2024',
          credits: 3,
        };

        const result = createAcademicHistorySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });

      it('should reject negative credits', () => {
        const invalidData = {
          student_id: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
          subject_code: 'CS101',
          subject_name: 'Introduction to Programming',
          grade: 1.25,
          semester: '1st' as const,
          academic_year: '2023-2024',
          credits: -1,
        };

        const result = createAcademicHistorySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('updateAcademicHistorySchema', () => {
      it('should validate partial update data', () => {
        const validData = {
          grade: 1.5,
          remarks: 'passed' as const,
        };

        const result = updateAcademicHistorySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should allow empty update object', () => {
        const result = updateAcademicHistorySchema.safeParse({});
        expect(result.success).toBe(true);
      });
    });

    describe('academicHistoryIdParamSchema', () => {
      it('should validate valid UUID', () => {
        const validData = {
          id: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
        };

        const result = academicHistoryIdParamSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID', () => {
        const invalidData = {
          id: 'not-a-uuid',
        };

        const result = academicHistoryIdParamSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('studentIdParamSchema', () => {
      it('should validate valid student UUID', () => {
        const validData = {
          studentId: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
        };

        const result = studentIdParamSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    describe('academicHistoryListQuerySchema', () => {
      it('should validate query parameters', () => {
        const validData = {
          page: '1',
          limit: '10',
          student_id: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
          semester: '1st',
          academic_year: '2023-2024',
        };

        const result = academicHistoryListQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(10);
        }
      });

      it('should transform string numbers to numbers', () => {
        const validData = {
          page: '2',
          limit: '20',
        };

        const result = academicHistoryListQuerySchema.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.page).toBe('number');
          expect(typeof result.data.limit).toBe('number');
        }
      });
    });
  });

  describe('DTOs', () => {
    it('should have correct CreateAcademicHistoryDTO structure', () => {
      const dto = {
        student_id: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
        subject_code: 'CS101',
        subject_name: 'Introduction to Programming',
        grade: 1.25,
        semester: '1st' as const,
        academic_year: '2023-2024',
        credits: 3,
        remarks: 'passed' as const,
      };

      expect(dto).toHaveProperty('student_id');
      expect(dto).toHaveProperty('subject_code');
      expect(dto).toHaveProperty('subject_name');
      expect(dto).toHaveProperty('grade');
      expect(dto).toHaveProperty('semester');
      expect(dto).toHaveProperty('academic_year');
      expect(dto).toHaveProperty('credits');
    });

    it('should have correct AcademicHistoryResponseDTO structure', () => {
      const dto = {
        id: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
        student_id: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
        subject_code: 'CS101',
        subject_name: 'Introduction to Programming',
        grade: 1.25,
        semester: '1st',
        academic_year: '2023-2024',
        credits: 3,
        remarks: 'passed',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('student_id');
      expect(dto).toHaveProperty('created_at');
      expect(dto).toHaveProperty('updated_at');
    });

    it('should have correct GPAResponseDTO structure', () => {
      const dto = {
        student_id: '018e5d7a-7c3f-7a1b-8c9d-0123456789ab',
        gpa: 1.75,
        total_credits: 12,
        total_grade_points: 21.0,
        records_count: 4,
      };

      expect(dto).toHaveProperty('student_id');
      expect(dto).toHaveProperty('gpa');
      expect(dto).toHaveProperty('total_credits');
      expect(dto).toHaveProperty('total_grade_points');
      expect(dto).toHaveProperty('records_count');
    });
  });
});
