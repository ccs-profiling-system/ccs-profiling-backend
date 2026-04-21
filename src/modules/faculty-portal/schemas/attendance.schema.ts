import { z } from 'zod';
import { attendanceStatusSchema } from './common.schemas';

/**
 * Attendance record schema
 * Required: student_id, status
 * Optional: remarks
 */
export const attendanceRecordSchema = z.object({
  student_id: z.string().uuid('Invalid student ID format'),
  status: attendanceStatusSchema,
  remarks: z.string().optional(),
});

/**
 * Submit attendance schema
 * Required: date, attendance_records array
 */
export const submitAttendanceSchema = z.object({
  date: z.string().date('Invalid date format (expected YYYY-MM-DD)'),
  attendance_records: z.array(attendanceRecordSchema).min(1, 'At least one attendance record is required'),
});

export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;
export type SubmitAttendanceInput = z.infer<typeof submitAttendanceSchema>;
