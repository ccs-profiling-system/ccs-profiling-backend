import { app } from './app';
import { config } from './config';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { validatePermissionConfig, getValidationSummary } from './rbac/config';

/**
 * Server Startup Script
 * 
 * This script handles the complete server initialization sequence:
 * 1. Validate RBAC permission configuration
 * 2. Initialize database connection
 * 3. Run database migrations
 * 4. Start Express server
 * 
 */

const validateRBACConfiguration = () => {
  console.log('🔄 Validating RBAC permission configuration...');
  
  try {
    // Validate permission configuration
    validatePermissionConfig();
    
    // Get and display validation summary
    const summary = getValidationSummary();
    console.log('✅ RBAC configuration validated successfully');
    console.log(`   - Total roles configured: ${summary.totalRoles}`);
    console.log(`   - Roles: ${summary.rolesConfigured.join(', ')}`);
    
    // Log permission counts for each role
    for (const [role, counts] of Object.entries(summary.permissionCounts)) {
      console.log(`   - ${role}: ${counts.allow} allow, ${counts.deny} deny`);
    }
  } catch (error) {
    console.error('❌ RBAC configuration validation failed:', error);
    throw error;
  }
};

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

const startServer = async () => {
  try {
    // Step 1: Validate RBAC permission configuration
    validateRBACConfiguration();
    
    // Step 2: Initialize database connection
    await initializeDatabase();
    
    // Step 3: Start Express server (migrations removed - run manually with npm run db:migrate)
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
