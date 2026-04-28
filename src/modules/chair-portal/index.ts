/**
 * Department Chair Portal Module
 * 
 * This module provides REST API endpoints for department chairs to manage:
 * - Dashboard statistics
 * - Student records and approvals
 * - Faculty records and teaching loads
 * - Course schedules with conflict detection
 * - Department events with workflow
 * - Research projects and approvals
 * - Analytics reports and exports
 * 
 * All endpoints are protected by RBAC permissions using the chair.* namespace
 * and filtered by department scope for multi-tenant data isolation.
 * 
 */

// Export combined router for all chair portal routes
export { chairPortalRouter } from './routes';

// Export types
export * from './types';
