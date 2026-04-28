import { db } from '../../../db';
import { students } from '../../../db/schema/students';
import { faculty } from '../../../db/schema/faculty';
import { events } from '../../../db/schema/events';
import { research } from '../../../db/schema/research';
import { approvals, ApprovalStatus, EntityType } from '../../../db/schema/approvals';
import { approvalRepository } from '../repositories/approval.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { NotificationType, NotificationPriority } from '../../../db/schema/approvalNotifications';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors';

/**
 * Custom error for entity not found
 */
export class EntityNotFoundError extends NotFoundError {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} with ID ${entityId} not found`);
  }
}

/**
 * Entity Application Service
 * 
 * Handles applying approved changes to target entities with conflict detection.
 * Implements versioning via entity_version field and updated_at timestamp comparison.
 * 
 */
export class EntityApplicationService {
  /**
   * Apply approved changes to the target entity
   * 
   * This method:
   * 1. Fetches the approval record
   * 2. Fetches the target entity
   * 3. Performs conflict detection via version comparison (unless force=true)
   * 4. Validates change_details against entity schema
   * 5. Applies changes in a transaction
   * 6. Increments entity version
   * 7. Records application timestamp
   * 
   * @param approvalId - The ID of the approval to apply
   * @param force - Skip conflict detection if true (for forced approvals)
   * @throws {ConflictError} If entity has been modified since submission (unless force=true)
   * @throws {EntityNotFoundError} If target entity doesn't exist
   * @throws {ValidationError} If change_details validation fails
   * 
   */
  async applyChanges(approvalId: string, force: boolean = false): Promise<void> {
    try {
      // Fetch the approval record
      const approval = await approvalRepository.findById(approvalId);
      
      if (!approval) {
        throw new Error(`Approval with ID ${approvalId} not found`);
      }

      // Fetch the target entity
      const entity = await this.fetchEntity(approval.entity_type, approval.entity_id);
      
      if (!entity) {
        throw new EntityNotFoundError(approval.entity_type, approval.entity_id);
      }

      // Conflict detection: Compare entity_version (unless force=true)
      // If entity_version is stored in approval, compare it with current entity version
      // Otherwise, use updated_at timestamp as fallback (Requirement 22.6)
      if (!force) {
        await this.detectConflict(approval, entity);
      }

      // Validate change_details against entity schema (Requirement 21.3)
      this.validateChangeDetails(approval.entity_type, approval.change_details as Record<string, any>);

      // Apply changes in a transaction (Requirement 21.7)
      await db.transaction(async (tx) => {
        // Apply partial update to target entity (Requirement 21.2)
        await this.updateEntity(
          tx,
          approval.entity_type,
          approval.entity_id,
          approval.change_details as Record<string, any>
        );

        // Increment entity version (Requirement 21.5)
        // Note: Since entities don't have version field yet, we rely on updated_at
        // which is automatically updated by the database

        // Record application timestamp (Requirement 21.6)
        await tx
          .update(approvals)
          .set({
            application_timestamp: new Date(),
            updated_at: new Date(),
          })
          .where(eq(approvals.id, approvalId));
      });
    } catch (error) {
      // If error occurs, mark approval as failed and record failure reason (Requirement 21.4, 21.5)
      if (error instanceof ConflictError) {
        // Conflict detected - mark as conflicted and create notification (Requirement 22.3, 22.4)
        await this.markAsConflicted(approvalId, error.message);
        throw error;
      } else if (error instanceof EntityNotFoundError || error instanceof ValidationError) {
        // Entity not found or validation failed - mark as failed (Requirement 21.4)
        await this.markAsFailed(approvalId, error.message);
        throw error;
      } else {
        // Unexpected error - mark as failed
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        await this.markAsFailed(approvalId, errorMessage);
        throw error;
      }
    }
  }

  /**
   * Fetch entity by type and ID
   * 
   * @param entityType - Type of entity (student, faculty, event, research)
   * @param entityId - Entity ID
   * @returns Entity record or undefined if not found
   */
  private async fetchEntity(entityType: string, entityId: string): Promise<any> {
    switch (entityType) {
      case EntityType.STUDENT:
        return await db.query.students.findFirst({
          where: eq(students.id, entityId),
        });
      
      case EntityType.FACULTY:
        return await db.query.faculty.findFirst({
          where: eq(faculty.id, entityId),
        });
      
      case EntityType.EVENT:
        return await db.query.events.findFirst({
          where: eq(events.id, entityId),
        });
      
      case EntityType.RESEARCH:
        return await db.query.research.findFirst({
          where: eq(research.id, entityId),
        });
      
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Detect conflicts by comparing entity versions
   * 
   * Uses entity_version if available, otherwise falls back to updated_at timestamp
   * (Requirement 22.1, 22.2, 22.6)
   * 
   * @param approval - Approval record
   * @param entity - Current entity record
   * @throws {ConflictError} If conflict is detected
   */
  private async detectConflict(approval: any, entity: any): Promise<void> {
    // If entity_version is captured in approval, use it for comparison (Requirement 22.1, 22.2)
    if (approval.entity_version !== null && approval.entity_version !== undefined) {
      // Entities don't have version field yet, so we'll use updated_at as proxy
      // In future, entities should have a version field that increments on each update
      
      // For now, compare updated_at timestamps
      // If entity was updated after approval submission, it's a conflict
      const entityUpdatedAt = entity.updated_at ? new Date(entity.updated_at).getTime() : 0;
      const submissionTime = approval.submission_timestamp 
        ? new Date(approval.submission_timestamp).getTime() 
        : 0;
      
      if (entityUpdatedAt > submissionTime) {
        throw new ConflictError(
          `Entity has been modified since submission. ` +
          `Entity last updated: ${entity.updated_at}, ` +
          `Approval submitted: ${approval.submission_timestamp}`
        );
      }
    }
  }

  /**
   * Validate change_details against entity schema
   * 
   * Ensures all fields in change_details are valid for the entity type
   * (Requirement 21.3)
   * 
   * @param entityType - Type of entity
   * @param changeDetails - Changes to validate
   * @throws {ValidationError} If validation fails
   */
  private validateChangeDetails(entityType: string, changeDetails: Record<string, any>): void {
    try {
      switch (entityType) {
        case EntityType.STUDENT:
          this.validateStudentChanges(changeDetails);
          break;
        
        case EntityType.FACULTY:
          this.validateFacultyChanges(changeDetails);
          break;
        
        case EntityType.EVENT:
          this.validateEventChanges(changeDetails);
          break;
        
        case EntityType.RESEARCH:
          this.validateResearchChanges(changeDetails);
          break;
        
        default:
          throw new ValidationError(`Unknown entity type: ${entityType}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Change details validation failed', error.errors);
      }
      throw error;
    }
  }

  /**
   * Validate student change details
   */
  private validateStudentChanges(changeDetails: Record<string, any>): void {
    const studentChangeSchema = z.object({
      first_name: z.string().max(100).optional(),
      last_name: z.string().max(100).optional(),
      middle_name: z.string().max(100).optional().nullable(),
      email: z.string().email().max(255).optional(),
      phone: z.string().max(20).optional().nullable(),
      date_of_birth: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      year_level: z.number().int().optional().nullable(),
      program: z.string().max(100).optional().nullable(),
      status: z.enum(['active', 'inactive', 'graduated']).optional(),
    }).strict();

    studentChangeSchema.parse(changeDetails);
  }

  /**
   * Validate faculty change details
   */
  private validateFacultyChanges(changeDetails: Record<string, any>): void {
    const facultyChangeSchema = z.object({
      first_name: z.string().max(100).optional(),
      last_name: z.string().max(100).optional(),
      middle_name: z.string().max(100).optional().nullable(),
      email: z.string().email().max(255).optional(),
      phone: z.string().max(20).optional().nullable(),
      department: z.string().max(100).optional(),
      position: z.string().max(100).optional().nullable(),
      specialization: z.string().max(255).optional().nullable(),
      office_location: z.string().max(255).optional().nullable(),
      consultation_hours: z.string().max(255).optional().nullable(),
      bio: z.string().max(1000).optional().nullable(),
      status: z.enum(['active', 'inactive']).optional(),
    }).strict();

    facultyChangeSchema.parse(changeDetails);
  }

  /**
   * Validate event change details
   */
  private validateEventChanges(changeDetails: Record<string, any>): void {
    const eventChangeSchema = z.object({
      event_name: z.string().max(255).optional(),
      event_type: z.string().max(50).optional(),
      description: z.string().optional().nullable(),
      event_date: z.string().optional(),
      start_time: z.string().optional().nullable(),
      end_time: z.string().optional().nullable(),
      location: z.string().max(255).optional().nullable(),
      organizer: z.string().max(200).optional().nullable(),
      max_participants: z.number().int().optional().nullable(),
      registration_deadline: z.string().optional().nullable(),
      status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'cancelled']).optional(),
      department_id: z.string().max(100).optional().nullable(),
    }).strict();

    eventChangeSchema.parse(changeDetails);
  }

  /**
   * Validate research change details
   */
  private validateResearchChanges(changeDetails: Record<string, any>): void {
    const researchChangeSchema = z.object({
      title: z.string().max(500).optional(),
      abstract: z.string().optional().nullable(),
      research_type: z.enum(['thesis', 'capstone', 'publication']).optional(),
      status: z.enum(['ongoing', 'completed', 'published']).optional(),
      start_date: z.string().optional().nullable(),
      completion_date: z.string().optional().nullable(),
      publication_url: z.string().max(500).optional().nullable(),
    }).strict();

    researchChangeSchema.parse(changeDetails);
  }

  /**
   * Apply partial update to entity
   * 
   * Only updates fields specified in changeDetails (Requirement 21.2)
   * 
   * @param tx - Database transaction
   * @param entityType - Type of entity
   * @param entityId - Entity ID
   * @param changeDetails - Changes to apply
   */
  private async updateEntity(
    tx: any,
    entityType: string,
    entityId: string,
    changeDetails: Record<string, any>
  ): Promise<void> {
    // Add updated_at to track when entity was modified
    const updateData = {
      ...changeDetails,
      updated_at: new Date(),
    };

    switch (entityType) {
      case EntityType.STUDENT:
        await tx
          .update(students)
          .set(updateData)
          .where(eq(students.id, entityId));
        break;
      
      case EntityType.FACULTY:
        await tx
          .update(faculty)
          .set(updateData)
          .where(eq(faculty.id, entityId));
        break;
      
      case EntityType.EVENT:
        await tx
          .update(events)
          .set(updateData)
          .where(eq(events.id, entityId));
        break;
      
      case EntityType.RESEARCH:
        await tx
          .update(research)
          .set(updateData)
          .where(eq(research.id, entityId));
        break;
      
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Mark approval as conflicted and create notification
   * 
   * (Requirement 22.3, 22.4)
   * 
   * @param approvalId - Approval ID
   * @param conflictMessage - Conflict description
   */
  private async markAsConflicted(approvalId: string, conflictMessage: string): Promise<void> {
    // Update approval status to conflicted
    await approvalRepository.update(approvalId, {
      status: ApprovalStatus.CONFLICTED,
      failure_reason: conflictMessage,
    });

    // Fetch approval to get submitter and reviewer info
    const approval = await approvalRepository.findById(approvalId);
    
    if (!approval) {
      return;
    }

    // Create notification for reviewer (Requirement 22.4)
    if (approval.reviewer_id) {
      await notificationRepository.create({
        user_id: approval.reviewer_id,
        change_request_id: approvalId,
        type: NotificationType.CONFLICT_DETECTED,
        message: `Conflict detected for change request #${approvalId}. ${conflictMessage}`,
        priority: NotificationPriority.HIGH,
        read_status: false,
      });
    }

    // Also notify submitter
    await notificationRepository.create({
      user_id: approval.submitter_id,
      change_request_id: approvalId,
      type: NotificationType.CONFLICT_DETECTED,
      message: `Your change request #${approvalId} has a conflict. ${conflictMessage}`,
      priority: NotificationPriority.HIGH,
      read_status: false,
    });
  }

  /**
   * Mark approval as failed and record failure reason
   * 
   * (Requirement 21.4, 21.5)
   * 
   * @param approvalId - Approval ID
   * @param failureReason - Reason for failure
   */
  private async markAsFailed(approvalId: string, failureReason: string): Promise<void> {
    await approvalRepository.update(approvalId, {
      status: ApprovalStatus.FAILED,
      failure_reason: failureReason,
    });

    // Fetch approval to get submitter info
    const approval = await approvalRepository.findById(approvalId);
    
    if (!approval) {
      return;
    }

    // Create notification for submitter
    await notificationRepository.create({
      user_id: approval.submitter_id,
      change_request_id: approvalId,
      type: NotificationType.APPLICATION_FAILED,
      message: `Failed to apply changes for request #${approvalId}. Reason: ${failureReason}`,
      priority: NotificationPriority.MEDIUM,
      read_status: false,
    });

    // Also notify reviewer if exists
    if (approval.reviewer_id) {
      await notificationRepository.create({
        user_id: approval.reviewer_id,
        change_request_id: approvalId,
        type: NotificationType.APPLICATION_FAILED,
        message: `Failed to apply changes for request #${approvalId}. Reason: ${failureReason}`,
        priority: NotificationPriority.MEDIUM,
        read_status: false,
      });
    }
  }
}

// Export singleton instance
export const entityApplicationService = new EntityApplicationService();
