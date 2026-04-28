/**
 * Rooms Module
 * Exports room routes and dependencies
 */

import { RoomRepository } from './repositories/room.repository';
import { RoomService } from './services/room.service';
import { RoomController } from './controllers/room.controller';
import { createRoomRoutes } from './routes/room.routes';

// Initialize dependencies
const roomRepository = new RoomRepository();
const roomService = new RoomService(roomRepository);
const roomController = new RoomController(roomService);

// Export routes
export const roomRoutes = createRoomRoutes(roomController);

// Export for testing
export { RoomRepository, RoomService, RoomController };
