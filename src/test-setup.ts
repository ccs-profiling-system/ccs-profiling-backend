// Test setup file - runs before all tests
// Set up environment variables for testing

process.env.NODE_ENV = 'development';
process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '7d';
process.env.UPLOAD_DIR = './test-uploads';
process.env.MAX_FILE_SIZE = '10485760';
process.env.CORS_ORIGIN = 'http://localhost:5173';
