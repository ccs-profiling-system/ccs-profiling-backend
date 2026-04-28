/**
 * Data Transfer Objects for Schedule Occurrences Module
 */

export interface ListOccurrencesQueryDto {
  start?: string; // ISO date
  end?: string; // ISO date
}

export interface CancelOccurrenceDto {
  cancellationReason: string;
}

export interface OccurrenceResponseDto {
  id: string;
  scheduleId: string;
  occurrenceDate: string;
  isCancelled: boolean;
  cancellationReason?: string | null;
  created_at: Date;
}
