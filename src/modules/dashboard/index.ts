/**
 * Dashboard Module
 * Exports all dashboard-related components
 * 
 * Three-layer architecture:
 * - Controller: HTTP request/response handling
 * - Service: Business logic and metric computation
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7
 */

import { db } from '../../db';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';
import { createDashboardRoutes } from './routes/dashboard.routes';

// Initialize service
const dashboardService = new DashboardService(db);

// Initialize controller
const dashboardController = new DashboardController(dashboardService);

// Create routes
const dashboardRoutes = createDashboardRoutes(dashboardController);

// Exports
export { dashboardRoutes };
export * from './types';
export { DashboardService } from './services/dashboard.service';
export { DashboardController } from './controllers/dashboard.controller';
