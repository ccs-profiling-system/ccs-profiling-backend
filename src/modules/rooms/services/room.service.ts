import { RoomRepository } from '../repositories/room.repository';
import { CreateRoomDto, UpdateRoomDto, ListRoomsQueryDto } from '../types/dtos';
import { AppError } from '../../../shared/utils/appError';

/**
 * Room Service
 * Business logic for room management
 */
export class RoomService {
  constructor(private roomRepository: RoomRepository) {}

  /**
   * List all rooms with pagination and filters
   */
  async listRooms(query: ListRoomsQueryDto) {
    return await this.roomRepository.findAll(query);
  }

  /**
   * Get room by ID
   */
  async getRoomById(id: string) {
    const room = await this.roomRepository.findById(id);

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    return room;
  }

  /**
   * Create new room
   */
  async createRoom(data: CreateRoomDto) {
    // Check if name already exists
    const existing = await this.roomRepository.findByName(data.name);
    if (existing) {
      throw new AppError('Room with this name already exists', 409);
    }

    const newRoom = await this.roomRepository.create({
      name: data.name,
      building: data.building,
      capacity: data.capacity,
      type: data.type,
      facilities: data.facilities || [],
      status: data.status || 'available',
    });

    return newRoom;
  }

  /**
   * Update room by ID
   */
  async updateRoom(id: string, data: UpdateRoomDto) {
    // Check if room exists
    const existing = await this.roomRepository.findById(id);
    if (!existing) {
      throw new AppError('Room not found', 404);
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.roomRepository.findByName(data.name);
      if (duplicate) {
        throw new AppError('Room with this name already exists', 409);
      }
    }

    const updated = await this.roomRepository.update(id, data);

    if (!updated) {
      throw new AppError('Failed to update room', 500);
    }

    return updated;
  }

  /**
   * Delete room by ID (soft delete)
   */
  async deleteRoom(id: string) {
    const existing = await this.roomRepository.findById(id);
    if (!existing) {
      throw new AppError('Room not found', 404);
    }

    const deleted = await this.roomRepository.softDelete(id);

    if (!deleted) {
      throw new AppError('Failed to delete room', 500);
    }

    return { message: 'Room deleted successfully' };
  }

  /**
   * Restore soft-deleted room
   */
  async restoreRoom(id: string) {
    const restored = await this.roomRepository.restore(id);

    if (!restored) {
      throw new AppError('Room not found or already active', 404);
    }

    return restored;
  }

  /**
   * Permanently delete room
   */
  async permanentDeleteRoom(id: string) {
    const deleted = await this.roomRepository.permanentDelete(id);

    if (!deleted) {
      throw new AppError('Room not found', 404);
    }

    return { message: 'Room permanently deleted' };
  }

  /**
   * Get deleted rooms
   */
  async getDeletedRooms() {
    return await this.roomRepository.findDeleted();
  }
}
