import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { config } from './index';

describe('Configuration Module', () => {
  it('should load configuration from environment variables', () => {
    expect(config).toBeDefined();
    expect(config.nodeEnv).toBeDefined();
    expect(config.port).toBeDefined();
    expect(config.database).toBeDefined();
    expect(config.jwt).toBeDefined();
  });

  it('should have all required configuration fields', () => {
    // Verify all required fields exist
    expect(config).toHaveProperty('nodeEnv');
    expect(config).toHaveProperty('port');
    expect(config).toHaveProperty('database');
    expect(config.database).toHaveProperty('url');
    expect(config).toHaveProperty('jwt');
    expect(config.jwt).toHaveProperty('secret');
    expect(config.jwt).toHaveProperty('refreshSecret');
    expect(config.jwt).toHaveProperty('expiresIn');
    expect(config.jwt).toHaveProperty('refreshExpiresIn');
  });

  it('should have DATABASE_URL configured', () => {
    expect(config.database.url).toBeDefined();
    expect(config.database.url).toContain('postgresql://');
  });

  it('should have JWT secrets configured', () => {
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.secret.length).toBeGreaterThan(0);
    expect(config.jwt.refreshSecret).toBeDefined();
    expect(config.jwt.refreshSecret.length).toBeGreaterThan(0);
  });

  it('should have PORT configured', () => {
    expect(config.port).toBeDefined();
    expect(typeof config.port).toBe('number');
    expect(config.port).toBeGreaterThan(0);
  });

  it('should have NODE_ENV configured', () => {
    expect(config.nodeEnv).toBeDefined();
    expect(['development', 'staging', 'production', 'test']).toContain(config.nodeEnv);
  });

  it('should parse numeric values correctly', () => {
    expect(typeof config.port).toBe('number');
    expect(typeof config.database.pool.max).toBe('number');
    expect(typeof config.upload.maxFileSize).toBe('number');
  });

  it('should have database pool configuration', () => {
    expect(config.database.pool).toBeDefined();
    expect(config.database.pool.max).toBeGreaterThan(0);
    expect(config.database.pool.min).toBeGreaterThan(0);
    expect(config.database.pool.idleTimeout).toBeGreaterThan(0);
    expect(config.database.pool.connectionTimeout).toBeGreaterThan(0);
  });
});

describe('Configuration Validation Behavior', () => {
  it('should validate environment variables on module import', () => {
    // This test verifies that the config module successfully loaded
    // If required variables were missing, the module would have thrown
    // an error during import and this test would not run
    expect(config).toBeDefined();
    expect(config.database.url).toBeDefined();
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.refreshSecret).toBeDefined();
  });

  it('should have all required environment variables configured', () => {
    // Verify that all required variables are present
    // These are the variables that would cause startup to fail if missing
    const requiredVars = [
      process.env.DATABASE_URL,
      process.env.JWT_SECRET,
      process.env.JWT_REFRESH_SECRET,
    ];

    requiredVars.forEach((varValue) => {
      expect(varValue).toBeDefined();
      expect(varValue).not.toBe('');
    });
  });

  it('should use default values for optional environment variables', () => {
    // Verify that optional variables have defaults
    expect(config.nodeEnv).toBeDefined();
    expect(config.port).toBeDefined();
    expect(config.database.pool.max).toBeDefined();
    expect(config.upload.dir).toBeDefined();
    expect(config.cors.origin).toBeDefined();
  });
});
