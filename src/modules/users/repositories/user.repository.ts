import { eq, and, isNull } from 'drizzle-orm';
import { Database } from '../../../db';
import { users } from '../../../db/schema';

export interface CreateUserData {
  email: string;
  password_hash: string;
  role: 'admin' | 'faculty' | 'student';
}

export interface UpdateUserData {
  email?: string;
  password_hash?: string;
  is_active?: boolean;
  last_login?: Date;
}

export class UserRepository {
  constructor(private db: Database) {}

  /**
   * Find user by email (excludes soft-deleted users)
   */
  async findByEmail(email: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find user by ID (excludes soft-deleted users)
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deleted_at)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData, tx?: Database) {
    const dbInstance = tx || this.db;
    const result = await dbInstance.insert(users).values(data).returning();

    return result[0];
  }

  /**
   * Update user by ID
   */
  async update(id: string, data: UpdateUserData) {
    const result = await this.db
      .update(users)
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Soft delete user by ID
   */
  async softDelete(id: string) {
    await this.db
      .update(users)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(users.id, id));
  }
}
