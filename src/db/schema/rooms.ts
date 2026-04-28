import { pgTable, varchar, integer, text, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { uuidPrimaryKey, timestampsWithSoftDelete } from './utils';

/**
 * Rooms table schema
 * 
 * Stores room information for scheduling.
 * Includes capacity, facilities, and availability status.
 * Supports soft delete for audit trail preservation.
 * 
 * @example
 * {
 *   name: "Room 101",
 *   building: "Main Building",
 *   capacity: 40,
 *   type: "lecture",
 *   facilities: ["projector", "whiteboard", "aircon"]
 * }
 */
export const rooms = pgTable('rooms', {
  id: uuidPrimaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  building: varchar('building', { length: 100 }),
  capacity: integer('capacity'),
  type: varchar('type', { length: 50 }), // lecture, laboratory, conference, etc.
  facilities: text('facilities').array(), // Array of facility names
  status: varchar('status', { length: 20 }).default('available').notNull(), // available, maintenance, reserved
  ...timestampsWithSoftDelete,
}, (table) => ({
  // Unique constraint on name
  nameUnique: uniqueIndex('rooms_name_unique').on(table.name),
  // Indexes for query optimization
  buildingIdx: index('rooms_building_idx').on(table.building),
  typeIdx: index('rooms_type_idx').on(table.type),
  statusIdx: index('rooms_status_idx').on(table.status),
}));
