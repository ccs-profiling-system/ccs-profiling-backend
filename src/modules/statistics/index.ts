/**
 * Statistics Module
 * Exports statistics routes and dependencies
 */

import { InstructionsStatisticsService } from './services/instructions-statistics.service';
import { SchedulesStatisticsService } from './services/schedules-statistics.service';
import { StatisticsController } from './controllers/statistics.controller';
import { createStatisticsRoutes } from './routes/statistics.routes';

// Initialize dependencies
const instructionsStatisticsService = new InstructionsStatisticsService();
const schedulesStatisticsService = new SchedulesStatisticsService();
const statisticsController = new StatisticsController(
  instructionsStatisticsService,
  schedulesStatisticsService
);

// Export routes
export const statisticsRoutes = createStatisticsRoutes(statisticsController);

// Export services for testing
export { InstructionsStatisticsService, SchedulesStatisticsService, StatisticsController };
