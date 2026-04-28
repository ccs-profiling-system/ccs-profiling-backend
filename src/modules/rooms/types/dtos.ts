/**
 * Data Transfer Objects for Rooms Module
 */

export interface CreateRoomDto {
  name: string;
  building?: string;
  capacity?: number;
  type?: string;
  facilities?: string[];
  status?: 'available' | 'maintenance' | 'reserved';
}

export interface UpdateRoomDto {
  name?: string;
  building?: string;
  capacity?: number;
  type?: string;
  facilities?: string[];
  status?: 'available' | 'maintenance' | 'reserved';
}

export interface ListRoomsQueryDto {
  search?: string;
  building?: string;
  type?: string;
  status?: 'available' | 'maintenance' | 'reserved';
  page?: number;
  limit?: number;
}

export interface RoomResponseDto {
  id: string;
  name: string;
  building?: string | null;
  capacity?: number | null;
  type?: string | null;
  facilities?: string[] | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}
