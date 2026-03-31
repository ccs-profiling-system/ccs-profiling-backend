/**
 * Instruction Module
 * Exports all instruction-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and orchestration
 * - Repository: Database access layer
 */

import { db } from '../../db';
import { InstructionRepository } from './repositories/instruction.repository';
import { InstructionService } from './services/instruction.service';
import { InstructionController } from './controllers/instruction.controller';
import { createInstructionRoutes } from './routes/instruction.routes';

// Initialize repository
const instructionRepository = new InstructionRepository(db);

// Initialize service
const instructionService = new InstructionService(instructionRepository, db);

// Initialize controller
const instructionController = new InstructionController(instructionService);

// Create routes
const instructionRoutes = createInstructionRoutes(instructionController);

// Exports
export { instructionRoutes };
export * from './types';
export * from './schemas/instruction.schema';
export { InstructionRepository } from './repositories/instruction.repository';
export { InstructionService } from './services/instruction.service';
export { InstructionController } from './controllers/instruction.controller';
