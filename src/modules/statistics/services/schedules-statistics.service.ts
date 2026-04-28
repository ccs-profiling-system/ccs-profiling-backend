import { db } from '../../../db';
import { schedules, rooms, faculty } from '../../../db/schema';
import { isNull, sql, eq, and } from 'drizzle-orm';

/**
 * Schedules Statistics Service
 * Provides aggregate statistics for schedules
 */
export class SchedulesStatisticsService {
  /**
   * Get comprehensive statistics for schedules module
   */
  async getStatistics(semester?: string, academicYear?: string) {
    const conditions = [isNull(schedules.deleted_at)];

    if (semester) {
      conditions.push(eq(schedules.semester, semester));
    }

    if (academicYear) {
      conditions.push(eq(schedules.academic_year, academicYear));
    }

    // Get total schedules count
    const [{ totalSchedules }] = await db
      .select({ totalSchedules: sql<number>`count(*)::int` })
      .from(schedules)
      .where(and(...conditions));

    // Get schedules by type
    const schedulesByTypeResult = await db
      .select({
        type: schedules.schedule_type,
        count: sql<number>`count(*)::int`,
      })
      .from(schedules)
      .where(and(...conditions))
      .groupBy(schedules.schedule_type);

    const schedulesByType: Record<string, number> = {};
    schedulesByTypeResult.forEach((row) => {
      schedulesByType[row.type] = row.count;
    });

    // Get room utilization (count of schedules per room)
    const roomUtilizationResult = await db
      .select({
        room: schedules.room,
        count: sql<number>`count(*)::int`,
      })
      .from(schedules)
      .where(and(...conditions))
      .groupBy(schedules.room);

    const roomUtilization: Record<string, number> = {};
    roomUtilizationResult.forEach((row) => {
      roomUtilization[row.room] = row.count;
    });

    // Get faculty workload (count of schedules per faculty)
    const facultyWorkloadResult = await db
      .select({
        facultyId: schedules.faculty_id,
        facultyName: sql<string>`CONCAT(${faculty.first_name}, ' ', ${faculty.last_name})`,
        count: sql<number>`count(${schedules.id})::int`,
      })
      .from(schedules)
      .leftJoin(faculty, eq(schedules.faculty_id, faculty.id))
      .where(and(...conditions, sql`${schedules.faculty_id} IS NOT NULL`))
      .groupBy(schedules.faculty_id, faculty.first_name, faculty.last_name);

    const facultyWorkload: Record<string, number> = {};
    facultyWorkloadResult.forEach((row) => {
      if (row.facultyName) {
        facultyWorkload[row.facultyName] = row.count;
      }
    });

    // Get schedules by day
    const schedulesByDayResult = await db
      .select({
        day: schedules.day,
        count: sql<number>`count(*)::int`,
      })
      .from(schedules)
      .where(and(...conditions))
      .groupBy(schedules.day);

    const schedulesByDay: Record<string, number> = {};
    schedulesByDayResult.forEach((row) => {
      schedulesByDay[row.day] = row.count;
    });

    // Get recurring vs non-recurring
    const [{ recurringCount }] = await db
      .select({ recurringCount: sql<number>`count(*)::int` })
      .from(schedules)
      .where(and(...conditions, eq(schedules.is_recurring, true)));

    const [{ nonRecurringCount }] = await db
      .select({ nonRecurringCount: sql<number>`count(*)::int` })
      .from(schedules)
      .where(and(...conditions, eq(schedules.is_recurring, false)));

    return {
      totalSchedules,
      schedulesByType,
      roomUtilization,
      facultyWorkload,
      schedulesByDay,
      recurringSchedules: recurringCount,
      nonRecurringSchedules: nonRecurringCount,
    };
  }
}
