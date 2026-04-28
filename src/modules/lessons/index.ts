/**
 * Lessons Module
 * Exports lesson routes and dependencies
 */

import { LessonRepository } from './repositories/lesson.repository';
import { LessonService } from './services/lesson.service';
import { LessonController } from './controllers/lesson.controller';
import { createLessonRoutes, createLessonDetailRoutes } from './routes/lesson.routes';

// Initialize dependencies
const lessonRepository = new LessonRepository();
const lessonService = new LessonService(lessonRepository);
const lessonController = new LessonController(lessonService);

// Export routes
export const lessonRoutes = createLessonRoutes(lessonController);
export const lessonDetailRoutes = createLessonDetailRoutes(lessonController);

// Export for testing
export { LessonRepository, LessonService, LessonController };
