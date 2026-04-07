/**
 * Scheduling Module
 * Exports all scheduling-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and orchestration
 * - Repository: Database access layer
 */

import { db } from '../../db';
import { ScheduleRepository } from './repositories/schedule.repository';
import { ScheduleService } from './services/schedule.service';
import { ScheduleController } from './controllers/schedule.controller';
import { createScheduleRoutes } from './routes/schedule.routes';
import { InstructionRepository } from '../instructions/repositories/instruction.repository';
import { FacultyRepository } from '../faculty/repositories/faculty.repository';

// Initialize repositories
const scheduleRepository = new ScheduleRepository(db);
const instructionRepository = new InstructionRepository(db);
const facultyRepository = new FacultyRepository(db);

// Initialize service
const scheduleService = new ScheduleService(
  scheduleRepository,
  instructionRepository,
  facultyRepository
);

// Initialize controller
const scheduleController = new ScheduleController(scheduleService);

// Create routes
const scheduleRoutes = createScheduleRoutes(scheduleController);

// Exports
export { scheduleRoutes };
export * from './types';
export * from './schemas/schedule.schema';
export { ScheduleRepository } from './repositories/schedule.repository';
export { ScheduleService } from './services/schedule.service';
export { ScheduleController } from './controllers/schedule.controller';
