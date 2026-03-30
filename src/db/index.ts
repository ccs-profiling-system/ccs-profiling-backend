import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config';
import * as schema from './schema';

// Create postgres connection with pooling configuration
const queryClient = postgres(config.database.url, {
  max: config.database.pool.max,
  idle_timeout: config.database.pool.idleTimeout / 1000, // Convert to seconds
  connect_timeout: config.database.pool.connectionTimeout / 1000, // Convert to seconds
  max_lifetime: 60 * 30, // 30 minutes
});

// Create drizzle instance
export const db = drizzle(queryClient, { schema });

// Export types
export type Database = typeof db;
