import { z } from 'zod';

/**
 * Pagination schema for list endpoints
 * Default page: 1, default limit: 10, max limit: 100
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * Attendance status enum validation
 * Valid values: present, absent, late, excused
 */
export const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);

/**
 * Material type enum validation
 * Valid values: lecture_notes, assignment, reading_material, syllabus, exam, other
 */
export const materialTypeSchema = z.enum([
  'lecture_notes',
  'assignment',
  'reading_material',
  'syllabus',
  'exam',
  'other',
]);

/**
 * Research status enum validation
 * Valid values: draft, pending_approval, approved, rejected
 */
export const researchStatusSchema = z.enum(['draft', 'pending_approval', 'approved', 'rejected']);

export type PaginationParams = z.infer<typeof paginationSchema>;
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type MaterialType = z.infer<typeof materialTypeSchema>;
export type ResearchStatus = z.infer<typeof researchStatusSchema>;
