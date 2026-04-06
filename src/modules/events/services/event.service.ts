/**
 * Event Service
 * Business logic layer for event operations
 * 
 * Requirements: 11.1, 11.6
 */

import { EventRepository } from '../repositories/event.repository';
import { NotFoundError, ConflictError, ValidationError } from '../../../shared/errors';
import { generateUUIDv7 } from '../../../shared/utils/uuid';
import {
  CreateEventDTO,
  UpdateEventDTO,
  EventResponseDTO,
  EventListResponseDTO,
  EventParticipantDTO,
  AddParticipantDTO,
  EventFilters,
} from '../types';

export class EventService {
  constructor(private eventRepository: EventRepository) {}

  /**
   * Get event by ID
   * Requirement: 11.1
   */
  async getEvent(id: string): Promise<EventResponseDTO> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const participantCount = await this.eventRepository.getParticipantCount(id);

    return this.toResponseDTO(event, participantCount);
  }

  /**
   * List events with pagination and filters
   * Requirement: 11.1
   */
  async listEvents(filters?: EventFilters): Promise<EventListResponseDTO> {
    const result = await this.eventRepository.findAll(filters);

    // Get participant counts for all events
    const eventsWithCounts = await Promise.all(
      result.data.map(async (event) => {
        const participantCount = await this.eventRepository.getParticipantCount(event.id);
        return this.toResponseDTO(event, participantCount);
      })
    );

    return {
      data: eventsWithCounts,
      meta: result.meta,
    };
  }

  /**
   * Create a new event
   * Requirement: 11.1
   */
  async createEvent(data: CreateEventDTO): Promise<EventResponseDTO> {
    // Generate UUID v7 for primary key
    const id = generateUUIDv7();

    // Create event
    const event = await this.eventRepository.create({
      id,
      event_name: data.event_name,
      event_type: data.event_type,
      description: data.description,
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location,
      max_participants: data.max_participants,
    });

    return this.toResponseDTO(event, 0);
  }

  /**
   * Update event by ID
   * Requirement: 11.1
   */
  async updateEvent(id: string, data: UpdateEventDTO): Promise<EventResponseDTO> {
    // Check if event exists
    const existing = await this.eventRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Event not found');
    }

    // Update event
    const updated = await this.eventRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Event not found after update');
    }

    const participantCount = await this.eventRepository.getParticipantCount(id);

    return this.toResponseDTO(updated, participantCount);
  }

  /**
   * Delete event by ID (soft delete)
   * Requirement: 11.1
   */
  async deleteEvent(id: string): Promise<void> {
    const existing = await this.eventRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Event not found');
    }

    await this.eventRepository.softDelete(id);
  }

  /**
   * Add participant to event
   * Requirements: 11.3, 11.4, 11.6
   */
  async addParticipant(eventId: string, data: AddParticipantDTO): Promise<EventParticipantDTO> {
    // Verify event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if participant already registered
    const existingParticipant = await this.eventRepository.findExistingParticipant(
      eventId,
      data.student_id,
      data.faculty_id
    );

    if (existingParticipant) {
      throw new ConflictError('Participant is already registered for this event');
    }

    // Check max participants limit
    if (event.max_participants) {
      const currentCount = await this.eventRepository.getParticipantCount(eventId);
      if (currentCount >= event.max_participants) {
        throw new ConflictError('Event has reached maximum participant capacity');
      }
    }

    // Generate UUID v7 for participant
    const id = generateUUIDv7();

    // Add participant
    await this.eventRepository.addParticipant({
      id,
      event_id: eventId,
      student_id: data.student_id,
      faculty_id: data.faculty_id,
      participation_role: data.participation_role,
      attendance_status: data.attendance_status || 'registered',
    });

    // Fetch participant details
    const participants = await this.eventRepository.getParticipants(eventId);
    const participantWithDetails = participants.find((p) => p.participant.id === id);

    if (!participantWithDetails) {
      throw new NotFoundError('Participant not found after creation');
    }

    return this.toParticipantDTO(participantWithDetails);
  }

  /**
   * Remove participant from event
   * Requirement: 11.6
   */
  async removeParticipant(eventId: string, participantId: string): Promise<void> {
    // Verify event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Verify participant exists and belongs to this event
    const participant = await this.eventRepository.findParticipantById(participantId);
    if (!participant) {
      throw new NotFoundError('Participant not found');
    }

    if (participant.event_id !== eventId) {
      throw new ValidationError('Participant does not belong to this event');
    }

    await this.eventRepository.removeParticipant(participantId);
  }

  /**
   * Get all participants for an event
   * Requirement: 11.6
   */
  async getParticipants(eventId: string): Promise<EventParticipantDTO[]> {
    // Verify event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const participants = await this.eventRepository.getParticipants(eventId);

    return participants.map((p) => this.toParticipantDTO(p));
  }

  /**
   * Transform database entity to response DTO
   */
  private toResponseDTO(event: any, participantCount: number): EventResponseDTO {
    return {
      id: event.id,
      event_name: event.event_name,
      event_type: event.event_type,
      description: event.description || undefined,
      event_date: event.event_date instanceof Date
        ? event.event_date.toISOString().split('T')[0]
        : event.event_date,
      start_time: event.start_time || undefined,
      end_time: event.end_time || undefined,
      location: event.location || undefined,
      max_participants: event.max_participants || undefined,
      participant_count: participantCount,
      created_at: event.created_at.toISOString(),
      updated_at: event.updated_at.toISOString(),
    };
  }

  /**
   * Transform participant data to DTO
   */
  private toParticipantDTO(data: any): EventParticipantDTO {
    const { participant, student, faculty } = data;

    let participantName = 'Unknown';
    let participantType: 'student' | 'faculty' = 'student';

    if (student) {
      participantName = `${student.first_name} ${student.last_name}`;
      participantType = 'student';
    } else if (faculty) {
      participantName = `${faculty.first_name} ${faculty.last_name}`;
      participantType = 'faculty';
    }

    return {
      id: participant.id,
      event_id: participant.event_id,
      student_id: participant.student_id || undefined,
      faculty_id: participant.faculty_id || undefined,
      participant_name: participantName,
      participant_type: participantType,
      participation_role: participant.participation_role || undefined,
      attendance_status: participant.attendance_status,
      created_at: participant.created_at.toISOString(),
    };
  }

  /**
   * Get soft-deleted events (admin only)
   * Requirements: 28.5
   */
  async getDeletedEvents(filters?: EventFilters): Promise<EventListResponseDTO> {
    const result = await this.eventRepository.findDeleted(filters);

    return {
      data: result.data.map((event) => this.toResponseDTO(event, 0)),
      meta: result.meta,
    };
  }

  /**
   * Restore soft-deleted event
   * Requirements: 28.7
   */
  async restoreEvent(id: string): Promise<EventResponseDTO> {
    // Find event including deleted
    const event = await this.eventRepository.findByIdIncludingDeleted(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (!event.deleted_at) {
      throw new ConflictError('Event is not deleted');
    }

    // Restore event
    await this.eventRepository.restore(id);

    // Fetch and return restored event
    const restored = await this.eventRepository.findById(id);
    return this.toResponseDTO(restored!, 0);
  }

  /**
   * Permanently delete event (hard delete)
   * Requirements: 28.6
   */
  async permanentDeleteEvent(id: string): Promise<void> {
    // Find event including deleted
    const event = await this.eventRepository.findByIdIncludingDeleted(id);
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Permanently delete
    await this.eventRepository.permanentDelete(id);
  }
}
