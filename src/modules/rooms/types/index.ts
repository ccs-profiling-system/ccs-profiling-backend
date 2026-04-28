import { rooms } from '../../../db/schema';

/**
 * Room type from database schema
 */
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

/**
 * Room status enum
 */
export enum RoomStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}
