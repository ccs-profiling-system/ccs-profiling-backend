import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default {
  schema: [
    './src/db/schema/users.ts',
    './src/db/schema/students.ts',
    './src/db/schema/faculty.ts',
    './src/db/schema/entityCounters.ts',
    './src/db/schema/instructions.ts',
    './src/db/schema/enrollments.ts',
  ],
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  },
} satisfies Config;
