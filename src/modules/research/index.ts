/**
 * Research Module
 * Exports research module components and initializes dependencies
 * 
 */

import { db } from '../../db';
import { ResearchRepository } from './repositories/research.repository';
import { ResearchService } from './services/research.service';
import { ResearchController } from './controllers/research.controller';
import { createResearchRoutes } from './routes/research.routes';

// Initialize repository
const researchRepository = new ResearchRepository(db);

// Initialize service
const researchService = new ResearchService(researchRepository);

// Initialize controller
const researchController = new ResearchController(researchService);

// Create routes
const researchRoutes = createResearchRoutes(researchController);

// Export components
export {
  researchRepository,
  researchService,
  researchController,
  researchRoutes,
};

// Export types
export * from './types';
