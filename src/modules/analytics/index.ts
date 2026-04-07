/**
 * Analytics Module
 * Exports all analytics-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and analytics computation
 * 
 */

import { db } from '../../db';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsController } from './controllers/analytics.controller';
import { createAnalyticsRoutes } from './routes/analytics.routes';

// Initialize service
const analyticsService = new AnalyticsService(db);

// Initialize controller
const analyticsController = new AnalyticsController(analyticsService);

// Create routes
const analyticsRoutes = createAnalyticsRoutes(analyticsController);

// Exports
export { analyticsRoutes };
export * from './types';
export { AnalyticsService } from './services/analytics.service';
export { AnalyticsController } from './controllers/analytics.controller';
