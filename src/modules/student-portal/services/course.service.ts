/**
 * Student Portal - Course Service
 * Business logic layer for course management
 * 
 * Handles enrolled courses retrieval, course details, and weekly schedule.
 * Ensures students can only access courses they are enrolled in.
 * 
 */

import { eq, and, isNull } from 'drizzle-orm';
import { Database } from '../../../db';
import { 
  enrollments, 
  instructions,
  schedules,
  faculty,
  uploads
} from '../../../db/schema';
import { NotFoundError } from '../../../shared/errors';
import { 
  CourseDTO, 
  CourseDetailsDTO, 
  WeeklyScheduleDTO,
  ScheduleEntryDTO 
} from '../types';

export class CourseService {
  constructor(private db: Database) {}

  /**
   * Get enrolled courses for current semester
   * 
   * Retrieves all courses the student is enrolled in for the current semester.
   * Joins enrollments with instructions, schedules, and faculty tables.
   * Filters by current academic year and semester.
   * Orders by course code ascending.
   * 
   * @param studentId - The student UUID (internal ID)
   * @returns Array of enrolled course DTOs
   * 
   */
  async getEnrolledCourses(studentId: string): Promise<CourseDTO[]> {
    // Get current academic period
    const { currentSemester, currentAcademicYear } = this.getCurrentAcademicPeriod();

    // Query enrolled courses with joins
    const result = await this.db
      .select({
        id: enrollments.id,
        course_code: instructions.subject_code,
        course_name: instructions.subject_name,
        units: instructions.credits,
        enrollment_status: enrollments.enrollment_status,
        instruction_id: enrollments.instruction_id,
        semester: enrollments.semester,
        academic_year: enrollments.academic_year,
      })
      .from(enrollments)
      .innerJoin(instructions, eq(enrollments.instruction_id, instructions.id))
      .where(
        and(
          eq(enrollments.student_id, studentId),
          eq(enrollments.semester, currentSemester),
          eq(enrollments.academic_year, currentAcademicYear),
          isNull(instructions.deleted_at)
        )
      )
      .orderBy(instructions.subject_code);

    // For each course, get schedule and faculty information
    const coursesWithDetails = await Promise.all(
      result.map(async (row) => {
        // Get schedule information for this instruction
        const scheduleInfo = await this.getScheduleForInstruction(
          row.instruction_id,
          row.semester,
          row.academic_year
        );

        return {
          id: row.id,
          course_code: row.course_code,
          course_name: row.course_name,
          section: 'N/A', // Section info not in current schema
          instructor_name: scheduleInfo.instructor_name || 'TBA',
          schedule: scheduleInfo.schedule,
          room: scheduleInfo.room,
          units: row.units,
          enrollment_status: row.enrollment_status as 'enrolled' | 'dropped' | 'completed',
        };
      })
    );

    return coursesWithDetails;
  }

  /**
   * Get course details for a specific course
   * 
   * Retrieves comprehensive course information including description,
   * learning outcomes, grading criteria, and available materials.
   * Validates student is enrolled in the course before returning details.
   * 
   * @param studentId - The student UUID (internal ID)
   * @param courseId - The enrollment ID (course enrollment record)
   * @returns Course details DTO
   * @throws NotFoundError if course not found or student not enrolled
   * 
   */
  async getCourseDetails(studentId: string, courseId: string): Promise<CourseDetailsDTO> {
    // First, verify the student is enrolled in this course
    const enrollmentResult = await this.db
      .select({
        id: enrollments.id,
        instruction_id: enrollments.instruction_id,
        enrollment_status: enrollments.enrollment_status,
        semester: enrollments.semester,
        academic_year: enrollments.academic_year,
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.id, courseId),
          eq(enrollments.student_id, studentId)
        )
      )
      .limit(1);

    const enrollment = enrollmentResult[0];

    if (!enrollment) {
      throw new NotFoundError('Course not found or you are not enrolled in this course');
    }

    // Get instruction details
    const instructionResult = await this.db
      .select({
        subject_code: instructions.subject_code,
        subject_name: instructions.subject_name,
        description: instructions.description,
        credits: instructions.credits,
      })
      .from(instructions)
      .where(
        and(
          eq(instructions.id, enrollment.instruction_id),
          isNull(instructions.deleted_at)
        )
      )
      .limit(1);

    const instruction = instructionResult[0];

    if (!instruction) {
      throw new NotFoundError('Course information not found');
    }

    // Get schedule and faculty information
    const scheduleInfo = await this.getScheduleForInstruction(
      enrollment.instruction_id,
      enrollment.semester,
      enrollment.academic_year
    );

    // Get course materials
    const materials = await this.getCourseMaterials(enrollment.instruction_id);

    return {
      id: enrollment.id,
      course_code: instruction.subject_code,
      course_name: instruction.subject_name,
      section: 'N/A',
      instructor_name: scheduleInfo.instructor_name || 'TBA',
      schedule: scheduleInfo.schedule,
      room: scheduleInfo.room,
      units: instruction.credits,
      enrollment_status: enrollment.enrollment_status as 'enrolled' | 'dropped' | 'completed',
      description: instruction.description,
      learning_outcomes: null, // Not in current schema
      grading_criteria: null, // Not in current schema
      required_materials: null, // Not in current schema
      instructor_email: scheduleInfo.instructor_email || '',
      instructor_phone: scheduleInfo.instructor_phone,
      course_materials: materials,
    };
  }

  /**
   * Get weekly schedule for student
   * 
   * Parses schedule strings from schedules table to extract day, start_time, end_time.
   * Groups schedule entries by day of week (Monday through Sunday).
   * Orders entries within each day by start_time ascending.
   * 
   * @param studentId - The student UUID (internal ID)
   * @returns Weekly schedule grouped by day
   * 
   */
  async getWeeklySchedule(studentId: string): Promise<WeeklyScheduleDTO> {
    // Get current academic period
    const { currentSemester, currentAcademicYear } = this.getCurrentAcademicPeriod();

    // Get all enrolled courses for current semester
    const enrolledCourses = await this.db
      .select({
        instruction_id: enrollments.instruction_id,
        course_code: instructions.subject_code,
        course_name: instructions.subject_name,
      })
      .from(enrollments)
      .innerJoin(instructions, eq(enrollments.instruction_id, instructions.id))
      .where(
        and(
          eq(enrollments.student_id, studentId),
          eq(enrollments.semester, currentSemester),
          eq(enrollments.academic_year, currentAcademicYear),
          eq(enrollments.enrollment_status, 'enrolled'),
          isNull(instructions.deleted_at)
        )
      );

    // Get schedule entries for all enrolled courses
    const scheduleEntries: ScheduleEntryDTO[] = [];

    for (const course of enrolledCourses) {
      const courseSchedules = await this.db
        .select({
          day: schedules.day,
          start_time: schedules.start_time,
          end_time: schedules.end_time,
          room: schedules.room,
          faculty_id: schedules.faculty_id,
        })
        .from(schedules)
        .where(
          and(
            eq(schedules.instruction_id, course.instruction_id),
            eq(schedules.semester, currentSemester),
            eq(schedules.academic_year, currentAcademicYear),
            eq(schedules.schedule_type, 'class'),
            isNull(schedules.deleted_at)
          )
        );

      for (const schedule of courseSchedules) {
        // Get faculty name if faculty_id exists
        let instructorName = 'TBA';
        if (schedule.faculty_id) {
          const facultyResult = await this.db
            .select({
              first_name: faculty.first_name,
              last_name: faculty.last_name,
            })
            .from(faculty)
            .where(
              and(
                eq(faculty.id, schedule.faculty_id),
                isNull(faculty.deleted_at)
              )
            )
            .limit(1);

          if (facultyResult[0]) {
            instructorName = `${facultyResult[0].first_name} ${facultyResult[0].last_name}`;
          }
        }

        scheduleEntries.push({
          course_code: course.course_code,
          course_name: course.course_name,
          instructor_name: instructorName,
          room: schedule.room,
          day: this.capitalizeDayName(schedule.day),
          start_time: schedule.start_time,
          end_time: schedule.end_time,
        });
      }
    }

    // Group by day of week
    const weeklySchedule: WeeklyScheduleDTO = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    for (const entry of scheduleEntries) {
      const day = entry.day;
      if (weeklySchedule[day]) {
        weeklySchedule[day].push(entry);
      }
    }

    // Sort entries within each day by start_time
    for (const day in weeklySchedule) {
      weeklySchedule[day].sort((a, b) => {
        return a.start_time.localeCompare(b.start_time);
      });
    }

    return weeklySchedule;
  }

  /**
   * Get schedule information for an instruction
   * 
   * Helper method to retrieve schedule and faculty information for a course.
   * 
   * @param instructionId - The instruction UUID
   * @param semester - The semester
   * @param academicYear - The academic year
   * @returns Schedule information object
   */
  private async getScheduleForInstruction(
    instructionId: string,
    semester: string,
    academicYear: string
  ): Promise<{
    schedule: string | null;
    room: string | null;
    instructor_name: string | null;
    instructor_email: string | null;
    instructor_phone: string | null;
  }> {
    // Get schedule information
    const scheduleResult = await this.db
      .select({
        day: schedules.day,
        start_time: schedules.start_time,
        end_time: schedules.end_time,
        room: schedules.room,
        faculty_id: schedules.faculty_id,
      })
      .from(schedules)
      .where(
        and(
          eq(schedules.instruction_id, instructionId),
          eq(schedules.semester, semester),
          eq(schedules.academic_year, academicYear),
          eq(schedules.schedule_type, 'class'),
          isNull(schedules.deleted_at)
        )
      )
      .limit(1);

    if (scheduleResult.length === 0) {
      return {
        schedule: null,
        room: null,
        instructor_name: null,
        instructor_email: null,
        instructor_phone: null,
      };
    }

    const scheduleData = scheduleResult[0];

    // Format schedule string
    const scheduleString = `${this.capitalizeDayName(scheduleData.day)} ${scheduleData.start_time}-${scheduleData.end_time}`;

    // Get faculty information if faculty_id exists
    let instructorName: string | null = null;
    let instructorEmail: string | null = null;
    let instructorPhone: string | null = null;

    if (scheduleData.faculty_id) {
      const facultyResult = await this.db
        .select({
          first_name: faculty.first_name,
          last_name: faculty.last_name,
          email: faculty.email,
          phone: faculty.phone,
        })
        .from(faculty)
        .where(
          and(
            eq(faculty.id, scheduleData.faculty_id),
            isNull(faculty.deleted_at)
          )
        )
        .limit(1);

      if (facultyResult[0]) {
        instructorName = `${facultyResult[0].first_name} ${facultyResult[0].last_name}`;
        instructorEmail = facultyResult[0].email;
        instructorPhone = facultyResult[0].phone;
      }
    }

    return {
      schedule: scheduleString,
      room: scheduleData.room,
      instructor_name: instructorName,
      instructor_email: instructorEmail,
      instructor_phone: instructorPhone,
    };
  }

  /**
   * Get course materials for an instruction
   * 
   * Retrieves uploaded materials associated with a course.
   * 
   * @param instructionId - The instruction UUID
   * @returns Array of course materials
   */
  private async getCourseMaterials(
    instructionId: string
  ): Promise<Array<{ title: string; type: string; upload_date: string }>> {
    const materials = await this.db
      .select({
        original_name: uploads.original_name,
        file_type: uploads.file_type,
        created_at: uploads.created_at,
      })
      .from(uploads)
      .where(
        and(
          eq(uploads.entity_type, 'instruction'),
          eq(uploads.entity_id, instructionId)
        )
      )
      .orderBy(uploads.created_at);

    return materials.map((material) => ({
      title: material.original_name,
      type: material.file_type,
      upload_date: material.created_at.toISOString(),
    }));
  }

  /**
   * Get current academic period
   * 
   * Determines the current semester and academic year based on the current date.
   * 
   * @returns Object with currentSemester and currentAcademicYear
   */
  private getCurrentAcademicPeriod(): {
    currentSemester: string;
    currentAcademicYear: string;
  } {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-indexed

    let currentSemester: string;
    let currentAcademicYear: string;

    if (currentMonth >= 8 && currentMonth <= 12) {
      // First semester: August to December
      currentSemester = '1st';
      currentAcademicYear = `${currentYear}-${currentYear + 1}`;
    } else if (currentMonth >= 1 && currentMonth <= 5) {
      // Second semester: January to May
      currentSemester = '2nd';
      currentAcademicYear = `${currentYear - 1}-${currentYear}`;
    } else {
      // Summer: June to July
      currentSemester = 'summer';
      currentAcademicYear = `${currentYear - 1}-${currentYear}`;
    }

    return { currentSemester, currentAcademicYear };
  }

  /**
   * Capitalize day name
   * 
   * Converts day name to proper case (e.g., 'monday' -> 'Monday')
   * 
   * @param day - Day name in lowercase
   * @returns Capitalized day name
   */
  private capitalizeDayName(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }
}
