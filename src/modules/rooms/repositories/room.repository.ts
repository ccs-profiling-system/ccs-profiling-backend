import { eq, and, or, like, isNull, sql, desc } from 'drizzle-orm/pg-core';
import { db } from '../../../db';
import { rooms } from '../../../db/schema';
import { NewRoom, Room } from '../types';
import { ListRoomsQueryDto } from '../types/dtos';

/**
 * Room Repository
 * Handles database operations for rooms
 */
export class RoomRepository {
  /**
   * Find all rooms with pagination and filters
   */
  async findAll(query: ListRoomsQueryDto) {
    const { search, building, type, status, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [isNull(rooms.deleted_at)];

    if (search) {
      conditions.push(
        or(
          like(rooms.name, `%${search}%`),
          like(rooms.building, `%${search}%`)
        )!
      );
    }

    if (building) {
      conditions.push(eq(rooms.building, building));
    }

    if (type) {
      conditions.push(eq(rooms.type, type));
    }

    if (status) {
      conditions.push(eq(rooms.status, status));
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rooms)
      .where(and(...conditions));

    // Get paginated results
    const results = await db
      .select()
      .from(rooms)
      .where(and(...conditions))
      .orderBy(rooms.name)
      .limit(limit)
      .offset(offset);

    return {
      data: results,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Find room by ID
   */
  async findById(id: string): Promise<Room | undefined> {
    const [result] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, id), isNull(rooms.deleted_at)));

    return result;
  }

  /**
   * Find room by name
   */
  async findByName(name: string): Promise<Room | undefined> {
    const [result] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.name, name), isNull(rooms.deleted_at)));

    return result;
  }

  /**
   * Create new room
   */
  async create(data: NewRoom): Promise<Room> {
    const [result] = await db.insert(rooms).values(data).returning();
    return result;
  }

  /**
   * Update room by ID
   */
  async update(id: string, data: Partial<NewRoom>): Promise<Room | undefined> {
    const [result] = await db
      .update(rooms)
      .set({ ...data, updated_at: new Date() })
      .where(and(eq(rooms.id, id), isNull(rooms.deleted_at)))
      .returning();

    return result;
  }

  /**
   * Soft delete room by ID
   */
  async softDelete(id: string): Promise<boolean> {
    const [result] = await db
      .update(rooms)
      .set({ deleted_at: new Date() })
      .where(and(eq(rooms.id, id), isNull(rooms.deleted_at)))
      .returning();

    return !!result;
  }

  /**
   * Restore soft-deleted room
   */
  async restore(id: string): Promise<Room | undefined> {
    const [result] = await db
      .update(rooms)
      .set({ deleted_at: null })
      .where(eq(rooms.id, id))
      .returning();

    return result;
  }

  /**
   * Permanently delete room
   */
  async permanentDelete(id: string): Promise<boolean> {
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return result.rowCount > 0;
  }

  /**
   * Get deleted rooms
   */
  async findDeleted() {
    return await db
      .select()
      .from(rooms)
      .where(sql`${rooms.deleted_at} IS NOT NULL`)
      .orderBy(desc(rooms.deleted_at));
  }
}
