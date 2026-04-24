/**
 * Dashboard Service
 * 
 * Provides dashboard statistics and recent activities for the secretary portal.
 * Implements requirement 2.3-2.6 for dashboard data retrieval.
 */

import { db } from '../../../db';
import { students, faculty, events, research, auditLogs, pendingChanges } from '../../../db/schema';
import { count, desc, isNull, eq, sql } from 'drizzle-orm';
import { DashboardDTO, ActivityDTO } from '../types';

/**
 * Get dashboard statistics and recent activities
 * 
 * Returns:
 * - Total count of students (exclude soft-deleted)
 * - Total count of faculty (exclude soft-deleted)
 * - Total count of events (exclude soft-deleted)
 * - Total count of research projects (exclude soft-deleted)
 * - Count of pending changes with status 'pending_approval'
 * - 10 most recent activities from audit_logs
 * 
 * @returns Promise<DashboardDTO> Dashboard statistics and activities
 */
export async function getDashboardStats(): Promise<DashboardDTO> {
  // Get total count of students (exclude soft-deleted)
  const [studentCount] = await db
    .select({ count: count() })
    .from(students)
    .where(isNull(students.deleted_at));

  // Get total count of faculty (exclude soft-deleted)
  const [facultyCount] = await db
    .select({ count: count() })
    .from(faculty)
    .where(isNull(faculty.deleted_at));

  // Get total count of events (exclude soft-deleted)
  const [eventCount] = await db
    .select({ count: count() })
    .from(events)
    .where(isNull(events.deleted_at));

  // Get total count of research projects (exclude soft-deleted)
  const [researchCount] = await db
    .select({ count: count() })
    .from(research)
    .where(isNull(research.deleted_at));

  // Get count of pending changes
  const [pendingChangesResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pendingChanges)
    .where(eq(pendingChanges.status, 'pending_approval'));
  
  const pendingChangesCount = pendingChangesResult?.count || 0;

  // Get 10 most recent activities from audit_logs
  const recentActivities = await db
    .select({
      activity_type: auditLogs.action_type,
      entity_type: auditLogs.entity_type,
      entity_id: auditLogs.entity_id,
      timestamp: auditLogs.created_at,
      user_id: auditLogs.user_id,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.created_at))
    .limit(10);

  // Map to ActivityDTO format
  const activities: ActivityDTO[] = recentActivities.map((activity) => ({
    activity_type: activity.activity_type,
    entity_type: activity.entity_type,
    entity_id: activity.entity_id || '',
    timestamp: activity.timestamp,
    user_id: activity.user_id,
  }));

  return {
    stats: {
      total_students: studentCount.count,
      total_faculty: facultyCount.count,
      total_events: eventCount.count,
      total_research: researchCount.count,
      pending_changes: pendingChangesCount,
    },
    recent_activities: activities,
  };
}
