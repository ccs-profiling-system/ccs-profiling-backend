import { z } from 'zod';

/**
 * Validation schemas for Syllabus Module
 */

export const createSyllabusSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  contentType: z.enum(['file', 'link']),
  externalLink: z.string().url('Invalid URL').optional(),
}).refine(
  (data) => {
    if (data.contentType === 'link' && !data.externalLink) {
      return false;
    }
    return true;
  },
  {
    message: 'External link is required when content type is "link"',
    path: ['externalLink'],
  }
);

export const updateSyllabusSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  contentType: z.enum(['file', 'link']).optional(),
  externalLink: z.string().url('Invalid URL').optional(),
});
