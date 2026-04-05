/**
 * Events Module
 * Exports all event-related components
 * 
 * Requirements: 11.1, 11.6
 */

import { db } from '../../db';
import { EventRepository } from './repositories/event.repository';
import { EventService } from './services/event.service';
import { EventController } from './controllers/event.controller';
import { createEventRoutes } from './routes/event.routes';

// Initialize repository
const eventRepository = new EventRepository(db);

// Initialize service
const eventService = new EventService(eventRepository);

// Initialize controller
const eventController = new EventController(eventService);

// Create routes
const eventRoutes = createEventRoutes(eventController);

// Exports
export { eventRoutes };
export * from './types';
export { EventRepository } from './repositories/event.repository';
export { EventService } from './services/event.service';
export { EventController } from './controllers/event.controller';
