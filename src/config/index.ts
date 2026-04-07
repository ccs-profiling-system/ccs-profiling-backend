/**
 * Configuration Module
 * 
 * This module loads and validates environment variables at application startup.
 * 
 * STARTUP VALIDATION:
 * - Validation occurs when this module is imported (before server starts)
 * - If required variables are missing, the application will fail to start
 * - Error messages list all missing/invalid variables with helpful guidance
 * 
 * REQUIRED VARIABLES:
 * - DATABASE_URL: PostgreSQL connection string
 * - JWT_SECRET: Secret key for JWT token signing
 * - JWT_REFRESH_SECRET: Secret key for refresh token signing
 * 
 * OPTIONAL VARIABLES (with defaults):
 * - NODE_ENV: development (options: development, staging, production, test)
 * - PORT: 3000
 * - DB_POOL_MAX: 10
 * - DB_POOL_MIN: 2
 * - DB_POOL_IDLE_TIMEOUT: 30000
 * - DB_CONNECTION_TIMEOUT: 30000
 * - JWT_EXPIRES_IN: 7d
 * - JWT_REFRESH_EXPIRES_IN: 30d
 * - UPLOAD_DIR: ./uploads
 * - MAX_FILE_SIZE: 10485760 (10MB)
 * - CORS_ORIGIN: http://localhost:5173
 * 
 * See .env.example for a complete reference of all configuration variables.
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables - try multiple paths for flexibility
if (!process.env.DATABASE_URL) {
  // Try loading from project root
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

// Environment variable schema
// Required variables: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
// All other variables have default values
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  // Required: Database connection string
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_POOL_MAX: z.string().default('10'),
  DB_POOL_MIN: z.string().default('2'),
  DB_POOL_IDLE_TIMEOUT: z.string().default('30000'),
  DB_CONNECTION_TIMEOUT: z.string().default('30000'),
  // Required: JWT authentication secrets
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
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
      // Format error messages with details for each invalid field
      const errorMessages = error.errors.map((err) => {
        const field = err.path.join('.');
        const message = err.message;
        return `  - ${field}: ${message}`;
      });

      const errorDetails = errorMessages.join('\n');
      
      throw new Error(
        `\n❌ Configuration validation failed!\n\n` +
        `The following environment variables are missing or invalid:\n\n` +
        `${errorDetails}\n\n` +
        `Please check your .env file and ensure all required variables are set.\n` +
        `You can use .env.example as a reference for the required variables.\n`
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
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  upload: {
    dir: env.UPLOAD_DIR,
    maxFileSize: parseInt(env.MAX_FILE_SIZE, 10),
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
};
