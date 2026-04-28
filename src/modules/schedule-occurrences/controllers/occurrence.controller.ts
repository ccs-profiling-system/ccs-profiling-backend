import { Request, Response, NextFunction } from 'express';
import { OccurrenceService } from '../services/occurrence.service';
import { listOccurrencesQuerySchema, cancelOccurrenceSchema } from '../schemas/occurrence.schema';

/**
 * Schedule Occurrence Controller
 * Handles HTTP requests for schedule occurrence endpoints
 */
export class OccurrenceController {
  constructor(private occurrenceService: OccurrenceService) {}

  /**
   * Get all occurrences for a schedule
   * GET /api/v1/admin/schedules/:scheduleId/occurrences
   */
  getOccurrences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scheduleId } = req.params;
      const query = listOccurrencesQuerySchema.parse(req.query);
      
      const occurrences = await this.occurrenceService.getOccurrencesByScheduleId(
        scheduleId,
        query
      );

      res.status(200).json({
        success: true,
        data: occurrences,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel an occurrence
   * PUT /api/v1/admin/schedules/:scheduleId/occurrences/:occurrenceId/cancel
   */
  cancelOccurrence = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scheduleId, occurrenceId } = req.params;
      const data = cancelOccurrenceSchema.parse(req.body);

      const occurrence = await this.occurrenceService.cancelOccurrence(
        scheduleId,
        occurrenceId,
        data
      );

      res.status(200).json({
        success: true,
        data: occurrence,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Restore a cancelled occurrence
   * PUT /api/v1/admin/schedules/:scheduleId/occurrences/:occurrenceId/restore
   */
  restoreOccurrence = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scheduleId, occurrenceId } = req.params;

      const occurrence = await this.occurrenceService.restoreOccurrence(
        scheduleId,
        occurrenceId
      );

      res.status(200).json({
        success: true,
        data: occurrence,
      });
    } catch (error) {
      next(error);
    }
  };
}
