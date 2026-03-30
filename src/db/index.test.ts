import { describe, it, expect, beforeAll } from 'vitest';

// Set up test environment variables before importing config
beforeAll(() => {
  process.env.NODE_ENV = 'development';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.JWT_SECRET = 'test-secret-key';
});

describe('Database Configuration', () => {
  it('should have database URL configured', async () => {
    const { config } = await import('../config');
    expect(config.database.url).toBeDefined();
    expect(typeof config.database.url).toBe('string');
  });

  it('should have connection pooling configured', async () => {
    const { config } = await import('../config');
    expect(config.database.pool).toBeDefined();
    expect(config.database.pool.max).toBeGreaterThan(0);
    expect(config.database.pool.min).toBeGreaterThanOrEqual(0);
    expect(config.database.pool.idleTimeout).toBeGreaterThan(0);
    expect(config.database.pool.connectionTimeout).toBeGreaterThan(0);
  });

  it('should have valid pool configuration values', async () => {
    const { config } = await import('../config');
    expect(config.database.pool.max).toBeGreaterThanOrEqual(config.database.pool.min);
    expect(config.database.pool.max).toBeLessThanOrEqual(100); // Reasonable upper limit
    expect(config.database.pool.idleTimeout).toBeGreaterThan(1000); // At least 1 second
    expect(config.database.pool.connectionTimeout).toBeGreaterThan(1000); // At least 1 second
  });

  it('should use default pool values when not specified', async () => {
    const { config } = await import('../config');
    // These should match the defaults in the schema
    expect(config.database.pool.max).toBe(10);
    expect(config.database.pool.min).toBe(2);
    expect(config.database.pool.idleTimeout).toBe(30000);
    expect(config.database.pool.connectionTimeout).toBe(30000);
  });
});
