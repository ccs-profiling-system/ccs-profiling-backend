import { z } from 'zod';

/**
 * Validation schemas for Subjects Module
 */

export const createSubjectSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  units: z.number().int().min(1).max(10),
  semester: z.number().int().min(1).max(2),
  yearLevel: z.number().int().min(1).max(4),
  description: z.string().optional(),
  prerequisites: z.array(z.string()).optional().default([]),
  corequisites: z.array(z.string()).optional().default([]),
  type: z.enum(['core', 'elective', 'major', 'minor', 'general_education']),
  lectureHours: z.number().int().min(0).optional().default(0),
  laboratoryHours: z.number().int().min(0).optional().default(0),
  objectives: z.array(z.string()).optional().default([]),
  topics: z.array(z.string()).optional().default([]),
  curriculumId: z.string().uuid('Invalid curriculum ID'),
});

export const updateSubjectSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  units: z.number().int().min(1).max(10).optional(),
  semester: z.number().int().min(1).max(2).optional(),
  yearLevel: z.number().int().min(1).max(4).optional(),
  description: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
  corequisites: z.array(z.string()).optional(),
  type: z.enum(['core', 'elective', 'major', 'minor', 'general_education']).optional(),
  lectureHours: z.number().int().min(0).optional(),
  laboratoryHours: z.number().int().min(0).optional(),
  objectives: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  curriculumId: z.string().uuid().optional(),
});

export const listSubjectsQuerySchema = z.object({
  search: z.string().optional(),
  curriculumId: z.string().uuid().optional(),
  semester: z.coerce.number().int().min(1).max(2).optional(),
  yearLevel: z.coerce.number().int().min(1).max(4).optional(),
  type: z.enum(['core', 'elective', 'major', 'minor', 'general_education']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
