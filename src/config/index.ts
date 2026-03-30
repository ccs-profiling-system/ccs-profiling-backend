import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_POOL_MAX: z.string().default('10'),
  DB_POOL_MIN: z.string().default('2'),
  DB_POOL_IDLE_TIMEOUT: z.string().default('30000'),
  DB_CONNECTION_TIMEOUT: z.string().default('30000'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('10485760'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

// Validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.')).join(', ');
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}\n` +
          'Please check your .env file and ensure all required variables are set.'
      );
    }
    throw error;
  }
};

const env = parseEnv();

// Export configuration
export const config = {
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  database: {
    url: env.DATABASE_URL,
    pool: {
      max: parseInt(env.DB_POOL_MAX, 10),
      min: parseInt(env.DB_POOL_MIN, 10),
      idleTimeout: parseInt(env.DB_POOL_IDLE_TIMEOUT, 10),
      connectionTimeout: parseInt(env.DB_CONNECTION_TIMEOUT, 10),
    },
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  upload: {
    dir: env.UPLOAD_DIR,
    maxFileSize: parseInt(env.MAX_FILE_SIZE, 10),
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
};
