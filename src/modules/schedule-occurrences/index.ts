/**
 * Schedule Occurrences Module
 * Exports occurrence routes and dependencies
 */

import { OccurrenceRepository } from './repositories/occurrence.repository';
import { OccurrenceService } from './services/occurrence.service';
import { OccurrenceController } from './controllers/occurrence.controller';
import { createOccurrenceRoutes } from './routes/occurrence.routes';

// Initialize dependencies
const occurrenceRepository = new OccurrenceRepository();
const occurrenceService = new OccurrenceService(occurrenceRepository);
const occurrenceController = new OccurrenceController(occurrenceService);

// Export routes
export const occurrenceRoutes = createOccurrenceRoutes(occurrenceController);

// Export service for use in schedules module
export { OccurrenceService, OccurrenceRepository };

// Export for testing
export { OccurrenceController };
