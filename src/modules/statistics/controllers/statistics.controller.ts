import { Request, Response, NextFunction } from 'express';
import { InstructionsStatisticsService } from '../services/instructions-statistics.service';
import { SchedulesStatisticsService } from '../services/schedules-statistics.service';

/**
 * Statistics Controller
 * Handles HTTP requests for statistics endpoints
 */
export class StatisticsController {
  constructor(
    private instructionsStatisticsService: InstructionsStatisticsService,
    private schedulesStatisticsService: SchedulesStatisticsService
  ) {}

  /**
   * Get instructions statistics
   * GET /api/v1/admin/instructions/statistics
   */
  getInstructionsStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const statistics = await this.instructionsStatisticsService.getStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get schedules statistics
   * GET /api/v1/admin/schedules/statistics
   */
  getSchedulesStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { semester, academic_year } = req.query;

      const statistics = await this.schedulesStatisticsService.getStatistics(
        semester as string,
        academic_year as string
      );

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  };
}
