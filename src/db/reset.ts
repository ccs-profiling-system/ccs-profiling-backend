#!/usr/bin/env tsx

import { db } from './index';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Reset database by dropping all tables and recreating them
 * WARNING: This will delete all data!
 */
async function resetDatabase() {
  console.log('⚠️  WARNING: This will delete ALL data in the database!\n');
  console.log('🔄 Starting database reset...\n');

  try {
    // Drop all tables in the public schema
    console.log('🗑️  Dropping all tables...');
    await db.execute(sql`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
    `);
    console.log('✅ All tables dropped\n');

    console.log('📋 Database reset complete!');
    console.log('💡 Run "npm run db:push" to recreate tables from schema');
    console.log('💡 Then run "npm run db:seed" to populate with initial data\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
