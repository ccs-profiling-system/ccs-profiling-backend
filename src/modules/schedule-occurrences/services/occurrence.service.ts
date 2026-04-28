import { OccurrenceRepository } from '../repositories/occurrence.repository';
import { ListOccurrencesQueryDto, CancelOccurrenceDto } from '../types/dtos';
import { AppError } from '../../../shared/utils/appError';

/**
 * Schedule Occurrence Service
 * Business logic for schedule occurrence management
 */
export class OccurrenceService {
  constructor(private occurrenceRepository: OccurrenceRepository) {}

  /**
   * Get all occurrences for a schedule
   */
  async getOccurrencesByScheduleId(scheduleId: string, query: ListOccurrencesQueryDto) {
    return await this.occurrenceRepository.findByScheduleId(
      scheduleId,
      query.start,
      query.end
    );
  }

  /**
   * Cancel an occurrence
   */
  async cancelOccurrence(scheduleId: string, occurrenceId: string, data: CancelOccurrenceDto) {
    const occurrence = await this.occurrenceRepository.findById(occurrenceId);

    if (!occurrence) {
      throw new AppError('Occurrence not found', 404);
    }

    if (occurrence.schedule_id !== scheduleId) {
      throw new AppError('Occurrence does not belong to this schedule', 400);
    }

    if (occurrence.is_cancelled) {
      throw new AppError('Occurrence is already cancelled', 400);
    }

    const cancelled = await this.occurrenceRepository.cancel(
      occurrenceId,
      data.cancellationReason
    );

    if (!cancelled) {
      throw new AppError('Failed to cancel occurrence', 500);
    }

    return cancelled;
  }

  /**
   * Restore a cancelled occurrence
   */
  async restoreOccurrence(scheduleId: string, occurrenceId: string) {
    const occurrence = await this.occurrenceRepository.findById(occurrenceId);

    if (!occurrence) {
      throw new AppError('Occurrence not found', 404);
    }

    if (occurrence.schedule_id !== scheduleId) {
      throw new AppError('Occurrence does not belong to this schedule', 400);
    }

    if (!occurrence.is_cancelled) {
      throw new AppError('Occurrence is not cancelled', 400);
    }

    const restored = await this.occurrenceRepository.restore(occurrenceId);

    if (!restored) {
      throw new AppError('Failed to restore occurrence', 500);
    }

    return restored;
  }

  /**
   * Generate occurrences for a recurring schedule
   */
  generateOccurrences(
    scheduleId: string,
    startDate: Date,
    endDate: Date,
    pattern: 'weekly' | 'biweekly' | 'monthly'
  ) {
    const occurrences: Array<{ schedule_id: string; occurrence_date: string }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      occurrences.push({
        schedule_id: scheduleId,
        occurrence_date: current.toISOString().split('T')[0],
      });

      // Increment based on pattern
      switch (pattern) {
        case 'weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'biweekly':
          current.setDate(current.getDate() + 14);
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return occurrences;
  }

  /**
   * Create occurrences for a schedule
   */
  async createOccurrences(
    scheduleId: string,
    startDate: Date,
    endDate: Date,
    pattern: 'weekly' | 'biweekly' | 'monthly'
  ) {
    const occurrencesData = this.generateOccurrences(scheduleId, startDate, endDate, pattern);
    return await this.occurrenceRepository.createMany(occurrencesData);
  }
}
