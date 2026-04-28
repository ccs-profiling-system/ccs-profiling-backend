import { Request, Response, NextFunction } from 'express';
import { RoomService } from '../services/room.service';
import { 
  createRoomSchema, 
  updateRoomSchema, 
  listRoomsQuerySchema 
} from '../schemas/room.schema';

/**
 * Room Controller
 * Handles HTTP requests for room endpoints
 */
export class RoomController {
  constructor(private roomService: RoomService) {}

  /**
   * List all rooms with pagination and filters
   * GET /api/v1/admin/rooms
   */
  listRooms = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = listRoomsQuerySchema.parse(req.query);
      const result = await this.roomService.listRooms(query);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get room by ID
   * GET /api/v1/admin/rooms/:id
   */
  getRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const room = await this.roomService.getRoomById(id);

      res.status(200).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create new room
   * POST /api/v1/admin/rooms
   */
  createRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createRoomSchema.parse(req.body);
      const room = await this.roomService.createRoom(data);

      res.status(201).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update room by ID
   * PUT /api/v1/admin/rooms/:id
   */
  updateRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = updateRoomSchema.parse(req.body);
      const room = await this.roomService.updateRoom(id, data);

      res.status(200).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete room by ID (soft delete)
   * DELETE /api/v1/admin/rooms/:id
   */
  deleteRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.roomService.deleteRoom(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Restore soft-deleted room
   * PATCH /api/v1/admin/rooms/:id/restore
   */
  restoreRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const room = await this.roomService.restoreRoom(id);

      res.status(200).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Permanently delete room
   * DELETE /api/v1/admin/rooms/:id/permanent
   */
  permanentDeleteRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.roomService.permanentDeleteRoom(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get deleted rooms
   * GET /api/v1/admin/rooms/deleted
   */
  getDeletedRooms = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rooms = await this.roomService.getDeletedRooms();

      res.status(200).json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      next(error);
    }
  };
}
