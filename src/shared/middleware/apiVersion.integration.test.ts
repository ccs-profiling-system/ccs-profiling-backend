/**
 * API Version Middleware Integration Tests
 * Tests the middleware in the context of the Express app
 * 
 * Requirements: 30.5, 30.6
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app';

describe('API Version Middleware Integration', () => {
  it('should include X-API-Version header in health check response', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-api-version']).toBe('1.0.0');
  });

  it('should include X-API-Version header in 404 responses', async () => {
    const response = await request(app).get('/nonexistent-route');

    expect(response.headers['x-api-version']).toBe('1.0.0');
    expect(response.status).toBe(404);
  });

  it('should include X-API-Version header in all API routes', async () => {
    // Test an API route (this will fail auth but should still have the header)
    const response = await request(app).get('/api/v1/admin/students');

    expect(response.headers['x-api-version']).toBe('1.0.0');
  });
});
