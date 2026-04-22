/**
 * Dashboard Controller
 * 
 * HTTP request/response handling for secretary portal dashboard operations.
 * Provides dashboard statistics and recent activities.
 * 
 * Requirements: 2.1, 2.7
 */

import { Request, Response, NextFunction } from 'express';
import { getDashboardStats } from '../services/dashboard.service';

/**
 * GET /api/secretary/dashboard
 * 
 * Retrieve dashboard statistics and recent activities.
 * 
 * Returns:
 * - Total counts for students, faculty, events, and research projects
 * - Count of pending changes awaiting approval
 * - 10 most recent activities ordered by timestamp descending
 * 
 * @param _req - Express request (unused)
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with dashboard data on success
 * @throws Error if dashboard data retrieval fails
 * 
 * Requirements: 2.1, 2.7
 */
export async function getDashboard(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get dashboard statistics and recent activities
    const dashboardData = await getDashboardStats();

    // Return HTTP 200 with dashboard data
    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}
