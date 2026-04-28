import { db } from '../../../db';
import { curriculum, subjects } from '../../../db/schema';
import { isNull, sql, eq } from 'drizzle-orm/pg-core';

/**
 * Instructions Statistics Service
 * Provides aggregate statistics for curriculum and subjects
 */
export class InstructionsStatisticsService {
  /**
   * Get comprehensive statistics for instructions module
   */
  async getStatistics() {
    // Get total curriculum count
    const [{ totalCurriculum }] = await db
      .select({ totalCurriculum: sql<number>`count(*)::int` })
      .from(curriculum)
      .where(isNull(curriculum.deleted_at));

    // Get total subjects count
    const [{ totalSubjects }] = await db
      .select({ totalSubjects: sql<number>`count(*)::int` })
      .from(subjects)
      .where(isNull(subjects.deleted_at));

    // Get subjects by type
    const subjectsByTypeResult = await db
      .select({
        type: subjects.type,
        count: sql<number>`count(*)::int`,
      })
      .from(subjects)
      .where(isNull(subjects.deleted_at))
      .groupBy(subjects.type);

    const subjectsByType: Record<string, number> = {};
    subjectsByTypeResult.forEach((row) => {
      subjectsByType[row.type] = row.count;
    });

    // Get subjects by semester
    const subjectsBySemesterResult = await db
      .select({
        semester: subjects.semester,
        count: sql<number>`count(*)::int`,
      })
      .from(subjects)
      .where(isNull(subjects.deleted_at))
      .groupBy(subjects.semester);

    const subjectsBySemester: Record<string, number> = {};
    subjectsBySemesterResult.forEach((row) => {
      subjectsBySemester[row.semester.toString()] = row.count;
    });

    // Get subjects by year level
    const subjectsByYearLevelResult = await db
      .select({
        yearLevel: subjects.year_level,
        count: sql<number>`count(*)::int`,
      })
      .from(subjects)
      .where(isNull(subjects.deleted_at))
      .groupBy(subjects.year_level);

    const subjectsByYearLevel: Record<string, number> = {};
    subjectsByYearLevelResult.forEach((row) => {
      subjectsByYearLevel[row.yearLevel.toString()] = row.count;
    });

    // Get subjects by curriculum
    const subjectsByCurriculumResult = await db
      .select({
        curriculumId: subjects.curriculum_id,
        curriculumName: curriculum.name,
        count: sql<number>`count(${subjects.id})::int`,
      })
      .from(subjects)
      .leftJoin(curriculum, eq(subjects.curriculum_id, curriculum.id))
      .where(isNull(subjects.deleted_at))
      .groupBy(subjects.curriculum_id, curriculum.name);

    const subjectsByCurriculum = subjectsByCurriculumResult.map((row) => ({
      curriculumId: row.curriculumId,
      curriculumName: row.curriculumName,
      count: row.count,
    }));

    return {
      totalCurriculum,
      totalSubjects,
      subjectsByType,
      subjectsBySemester,
      subjectsByYearLevel,
      subjectsByCurriculum,
    };
  }
}
