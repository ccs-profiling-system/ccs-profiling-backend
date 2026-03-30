// Test setup file - runs before all tests
// Set up environment variables for testing
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Ensure all required environment variables are set for tests
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in .env file for tests to run');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in .env file for tests to run');
}

// Set defaults for optional variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '3000';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || './test-uploads';
process.env.MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '10485760';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
