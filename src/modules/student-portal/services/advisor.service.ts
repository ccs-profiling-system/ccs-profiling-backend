/**
 * Student Portal - Advisor Service
 * Business logic layer for advisor communication management
 * 
 * Handles advisor information retrieval, messaging, appointment scheduling,
 * and ensures students can only interact with their assigned advisor.
 * 
 * Requirements: 21.1-21.3, 22.1-22.5, 23.1-23.6, 24.1-24.5, 25.1-25.5, 26.1-26.8, 29.1-29.5
 */

import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';
import { Database } from '../../../db';
import {
  studentAdvisors,
  advisorMessages,
  advisorSlots,
  advisorAppointments,
  faculty,
  students,
  auditLogs,
} from '../../../db/schema';
import { NotFoundError, ConflictError, ValidationError } from '../../../shared/errors';
import {
  AdvisorDTO,
  MessageDTO,
  AppointmentSlotDTO,
  AppointmentDTO,
  PaginatedResponse,
  PaginationParams,
} from '../types';

export class AdvisorService {
  constructor(private db: Database) {}

  /**
   * Get assigned advisor information
   * 
   * Retrieves the advisor assigned to the student including contact details
   * and consultation information.
   * 
   * @param studentId - The student UUID
   * @returns Advisor information
   * @throws NotFoundError if no advisor is assigned
   * 
   * Requirements: 21.1, 21.2
   */
  async getAssignedAdvisor(studentId: string): Promise<AdvisorDTO> {
    const result = await this.db
      .select({
        id: faculty.id,
        first_name: faculty.first_name,
        last_name: faculty.last_name,
        email: faculty.email,
        phone: faculty.phone,
        office_location: faculty.office_location,
        consultation_hours: faculty.consultation_hours,
        specialization: faculty.specialization,
      })
      .from(studentAdvisors)
      .innerJoin(faculty, eq(studentAdvisors.faculty_id, faculty.id))
      .where(eq(studentAdvisors.student_id, studentId))
      .limit(1);

    const advisor = result[0];

    if (!advisor) {
      throw new NotFoundError('No advisor assigned to this student');
    }

    return {
      id: advisor.id,
      name: `${advisor.first_name} ${advisor.last_name}`,
      email: advisor.email,
      phone: advisor.phone,
      office_location: advisor.office_location,
      consultation_hours: advisor.consultation_hours,
      specialization: advisor.specialization,
    };
  }

  /**
   * Get message history with advisor
   * 
   * Retrieves all messages exchanged between student and their assigned advisor
   * with pagination support.
   * 
   * @param studentId - The student UUID
   * @param params - Pagination parameters (page, limit)
   * @returns Paginated list of messages
   * @throws NotFoundError if no advisor is assigned
   * 
   * Requirements: 22.1, 22.2, 22.3, 22.4
   */
  async getMessageHistory(
    studentId: string,
    params: PaginationParams
  ): Promise<PaginatedResponse<MessageDTO>> {
    // First, verify student has an assigned advisor
    const advisorAssignment = await this.db
      .select({ faculty_id: studentAdvisors.faculty_id })
      .from(studentAdvisors)
      .where(eq(studentAdvisors.student_id, studentId))
      .limit(1);

    if (advisorAssignment.length === 0) {
      throw new NotFoundError('No advisor assigned to this student');
    }

    const facultyId = advisorAssignment[0].faculty_id;

    const { page, limit } = params;
    const offset = (page - 1) * limit;

    // Count total messages
    const countResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(advisorMessages)
      .where(
        and(
          eq(advisorMessages.student_id, studentId),
          eq(advisorMessages.faculty_id, facultyId)
        )
      );

    const total = countResult[0]?.count || 0;

    // Fetch messages with pagination
    const messages = await this.db
      .select({
        id: advisorMessages.id,
        sender_id: advisorMessages.sender_id,
        sender_role: advisorMessages.sender_role,
        message_content: advisorMessages.message_content,
        is_read: advisorMessages.is_read,
        sent_at: advisorMessages.sent_at,
        student_first_name: students.first_name,
        student_last_name: students.last_name,
        faculty_first_name: faculty.first_name,
        faculty_last_name: faculty.last_name,
      })
      .from(advisorMessages)
      .leftJoin(students, eq(advisorMessages.student_id, students.id))
      .leftJoin(faculty, eq(advisorMessages.faculty_id, faculty.id))
      .where(
        and(
          eq(advisorMessages.student_id, studentId),
          eq(advisorMessages.faculty_id, facultyId)
        )
      )
      .orderBy(desc(advisorMessages.sent_at))
      .limit(limit)
      .offset(offset);

    const data = messages.map((msg) => {
      const senderName =
        msg.sender_role === 'student'
          ? `${msg.student_first_name} ${msg.student_last_name}`
          : `${msg.faculty_first_name} ${msg.faculty_last_name}`;

      return {
        id: msg.id,
        sender_name: senderName,
        sender_role: msg.sender_role as 'student' | 'faculty',
        message_content: msg.message_content,
        is_read: msg.is_read,
        sent_at: msg.sent_at.toISOString(),
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Send message to advisor
   * 
   * Creates a message record from student to their assigned advisor.
   * 
   * @param studentId - The student UUID
   * @param userId - The user UUID (for sender_id)
   * @param messageContent - The message content
   * @returns Created message details
   * @throws NotFoundError if no advisor is assigned
   * @throws ValidationError if message content is invalid
   * 
   * Requirements: 23.1, 23.2, 23.3, 23.4, 23.5
   */
  async sendMessage(
    studentId: string,
    userId: string,
    messageContent: string
  ): Promise<MessageDTO> {
    // Validate message content
    if (!messageContent || messageContent.trim().length === 0) {
      throw new ValidationError('Message content cannot be empty');
    }

    if (messageContent.length > 2000) {
      throw new ValidationError('Message content must not exceed 2000 characters');
    }

    // Get assigned advisor
    const advisorAssignment = await this.db
      .select({
        faculty_id: studentAdvisors.faculty_id,
        faculty_first_name: faculty.first_name,
        faculty_last_name: faculty.last_name,
      })
      .from(studentAdvisors)
      .innerJoin(faculty, eq(studentAdvisors.faculty_id, faculty.id))
      .where(eq(studentAdvisors.student_id, studentId))
      .limit(1);

    if (advisorAssignment.length === 0) {
      throw new ValidationError('No advisor assigned to this student');
    }

    const facultyId = advisorAssignment[0].faculty_id;

    // Get student name for response
    const studentResult = await this.db
      .select({
        first_name: students.first_name,
        last_name: students.last_name,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    const student = studentResult[0];

    // Create message record
    const messageResult = await this.db
      .insert(advisorMessages)
      .values({
        student_id: studentId,
        faculty_id: facultyId,
        sender_id: userId,
        sender_role: 'student',
        message_content: messageContent.trim(),
        is_read: false,
      })
      .returning();

    const message = messageResult[0];

    return {
      id: message.id,
      sender_name: `${student.first_name} ${student.last_name}`,
      sender_role: 'student',
      message_content: message.message_content,
      is_read: message.is_read,
      sent_at: message.sent_at.toISOString(),
    };
  }

  /**
   * Get available appointment slots
   * 
   * Retrieves all open time slots for the assigned advisor within the next 30 days.
   * 
   * @param studentId - The student UUID
   * @returns List of available appointment slots
   * @throws NotFoundError if no advisor is assigned
   * 
   * Requirements: 24.1, 24.2, 24.3, 24.4
   */
  async getAvailableSlots(studentId: string): Promise<AppointmentSlotDTO[]> {
    // Get assigned advisor
    const advisorAssignment = await this.db
      .select({ faculty_id: studentAdvisors.faculty_id })
      .from(studentAdvisors)
      .where(eq(studentAdvisors.student_id, studentId))
      .limit(1);

    if (advisorAssignment.length === 0) {
      throw new NotFoundError('No advisor assigned to this student');
    }

    const facultyId = advisorAssignment[0].faculty_id;

    // Calculate date range (today to 30 days from now)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

    // Fetch available slots
    const slots = await this.db
      .select({
        id: advisorSlots.id,
        slot_date: advisorSlots.slot_date,
        start_time: advisorSlots.start_time,
        end_time: advisorSlots.end_time,
        duration_minutes: advisorSlots.duration_minutes,
      })
      .from(advisorSlots)
      .where(
        and(
          eq(advisorSlots.faculty_id, facultyId),
          eq(advisorSlots.is_booked, false),
          gte(advisorSlots.slot_date, todayStr),
          lte(advisorSlots.slot_date, thirtyDaysStr)
        )
      )
      .orderBy(asc(advisorSlots.slot_date), asc(advisorSlots.start_time));

    return slots.map((slot) => ({
      id: slot.id,
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration_minutes: slot.duration_minutes,
    }));
  }

  /**
   * Get booked appointments
   * 
   * Retrieves all appointments the student has scheduled with their advisor.
   * 
   * @param studentId - The student UUID
   * @returns List of booked appointments
   * @throws NotFoundError if no advisor is assigned
   * 
   * Requirements: 25.1, 25.2, 25.3, 25.4
   */
  async getBookedAppointments(studentId: string): Promise<AppointmentDTO[]> {
    // Get assigned advisor
    const advisorAssignment = await this.db
      .select({ faculty_id: studentAdvisors.faculty_id })
      .from(studentAdvisors)
      .where(eq(studentAdvisors.student_id, studentId))
      .limit(1);

    if (advisorAssignment.length === 0) {
      throw new NotFoundError('No advisor assigned to this student');
    }

    const facultyId = advisorAssignment[0].faculty_id;

    // Fetch appointments with status 'scheduled' or 'completed'
    const appointments = await this.db
      .select({
        id: advisorAppointments.id,
        appointment_date: advisorAppointments.appointment_date,
        start_time: advisorAppointments.start_time,
        end_time: advisorAppointments.end_time,
        purpose: advisorAppointments.purpose,
        status: advisorAppointments.status,
        advisor_notes: advisorAppointments.advisor_notes,
      })
      .from(advisorAppointments)
      .where(
        and(
          eq(advisorAppointments.student_id, studentId),
          eq(advisorAppointments.faculty_id, facultyId),
          sql`${advisorAppointments.status} IN ('scheduled', 'completed')`
        )
      )
      .orderBy(
        desc(advisorAppointments.appointment_date),
        desc(advisorAppointments.start_time)
      );

    return appointments.map((appt) => ({
      id: appt.id,
      appointment_date: appt.appointment_date,
      start_time: appt.start_time,
      end_time: appt.end_time,
      purpose: appt.purpose,
      status: appt.status as 'scheduled' | 'completed' | 'cancelled',
      advisor_notes: appt.advisor_notes,
    }));
  }

  /**
   * Book an appointment
   * 
   * Creates an appointment record, marks the slot as booked, and logs the action.
   * 
   * @param studentId - The student UUID
   * @param userId - The user UUID (for audit logging)
   * @param slotId - The slot UUID to book
   * @param purpose - The appointment purpose
   * @param ipAddress - Request IP address (for audit logging)
   * @returns Created appointment details
   * @throws NotFoundError if no advisor is assigned or slot not found
   * @throws ConflictError if slot is already booked
   * @throws ValidationError if purpose is invalid
   * 
   * Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 29.1, 29.2, 29.3, 29.4, 29.5
   */
  async bookAppointment(
    studentId: string,
    userId: string,
    slotId: string,
    purpose: string,
    ipAddress?: string
  ): Promise<AppointmentDTO> {
    // Validate purpose
    if (!purpose || purpose.trim().length === 0) {
      throw new ValidationError('Appointment purpose is required');
    }

    if (purpose.length > 500) {
      throw new ValidationError('Appointment purpose must not exceed 500 characters');
    }

    // Get assigned advisor
    const advisorAssignment = await this.db
      .select({ faculty_id: studentAdvisors.faculty_id })
      .from(studentAdvisors)
      .where(eq(studentAdvisors.student_id, studentId))
      .limit(1);

    if (advisorAssignment.length === 0) {
      throw new ValidationError('No advisor assigned to this student');
    }

    const facultyId = advisorAssignment[0].faculty_id;

    // Check if slot exists and is available
    const slotResult = await this.db
      .select({
        id: advisorSlots.id,
        faculty_id: advisorSlots.faculty_id,
        slot_date: advisorSlots.slot_date,
        start_time: advisorSlots.start_time,
        end_time: advisorSlots.end_time,
        is_booked: advisorSlots.is_booked,
      })
      .from(advisorSlots)
      .where(eq(advisorSlots.id, slotId))
      .limit(1);

    const slot = slotResult[0];

    if (!slot) {
      throw new NotFoundError('Appointment slot not found');
    }

    if (slot.faculty_id !== facultyId) {
      throw new ValidationError('This slot does not belong to your assigned advisor');
    }

    if (slot.is_booked) {
      throw new ConflictError('This appointment slot is already booked');
    }

    // Create appointment record
    const appointmentResult = await this.db
      .insert(advisorAppointments)
      .values({
        student_id: studentId,
        faculty_id: facultyId,
        slot_id: slotId,
        appointment_date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        purpose: purpose.trim(),
        status: 'scheduled',
      })
      .returning();

    const appointment = appointmentResult[0];

    // Mark slot as booked
    await this.db
      .update(advisorSlots)
      .set({ is_booked: true })
      .where(eq(advisorSlots.id, slotId));

    // Log to audit_logs
    try {
      await this.db.insert(auditLogs).values({
        user_id: userId,
        action_type: 'create',
        entity_type: 'advisor_appointment',
        entity_id: appointment.id,
        after_state: {
          student_id: studentId,
          faculty_id: facultyId,
          slot_id: slotId,
          appointment_date: slot.slot_date,
          status: 'scheduled',
        },
        ip_address: ipAddress || null,
      });
    } catch (error) {
      // Don't block the operation if audit logging fails
      console.error('Failed to log appointment booking to audit_logs:', error);
    }

    return {
      id: appointment.id,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      purpose: appointment.purpose,
      status: appointment.status as 'scheduled' | 'completed' | 'cancelled',
      advisor_notes: appointment.advisor_notes,
    };
  }
}
