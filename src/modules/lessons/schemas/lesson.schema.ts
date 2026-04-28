import { z } from 'zod';

/**
 * Validation schemas for Lessons Module
 */

export const createLessonSchema = z.object({
  week: z.number().int().min(1).max(52),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  type: z.enum(['lecture', 'laboratory', 'discussion', 'examination', 'project']),
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

export const updateLessonSchema = z.object({
  week: z.number().int().min(1).max(52).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  type: z.enum(['lecture', 'laboratory', 'discussion', 'examination', 'project']).optional(),
  contentType: z.enum(['file', 'link']).optional(),
  externalLink: z.string().url('Invalid URL').optional(),
});
