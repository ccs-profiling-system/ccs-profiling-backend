import { app } from './app';
import { config } from './config';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Server Startup Script
 * 
 * This script handles the complete server initialization sequence:
 * 1. Initialize database connection
 * 2. Run database migrations
 * 3. Start Express server
 * 
 */

const initializeDatabase = async () => {
  console.log('🔄 Initializing database connection...');
  
  try {
    // Test database connection by executing a simple query
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
};

const runMigrations = async () => {
  console.log('🔄 Running database migrations...');
  
  const connectionString = config.database.url;
  const migrationClient = postgres(connectionString, { max: 1 });
  const migrationDb = drizzle(migrationClient);

  try {
    await migrate(migrationDb, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
};

const startServer = async () => {
  try {
    // Step 1: Initialize database connection
    await initializeDatabase();
    
    // Step 2: Run migrations
    await runMigrations();
    
    // Step 3: Start Express server
    app.listen(config.port, () => {
      console.log('');
      console.log('═════════════════════════════════════════════════════');
      console.log('CCS Profiling Backend Server Started Successfully!');
      console.log('═════════════════════════════════════════════════════');
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Server URL: http://localhost:${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`API Base: http://localhost:${config.port}/api/v1`);
      console.log('═════════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();
