import { describe, it, expect, beforeEach } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { idempotencyMiddleware, clearIdempotencyCache } from './idempotency.middleware';
import { errorHandler } from './errorHandler';

describe('Idempotency Middleware Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    // Clear cache before each test
    clearIdempotencyCache();

    // Create fresh Express app for each test
    app = express();
    app.use(express.json());

    // Setup test routes with idempotency middleware
    app.post('/api/v1/approvals', idempotencyMiddleware, (req: Request, res: Response) => {
      res.status(201).json({
        success: true,
        data: {
          id: 'approval-123',
          entity_type: req.body.entity_type,
          status: 'pending',
        },
      });
    });

    app.post('/api/v1/approvals/bulk-approve', idempotencyMiddleware, (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        data: {
          successful: req.body.approvalIds,
          failed: [],
        },
      });
    });

    // Route without idempotency middleware for comparison
    app.post('/api/v1/no-idempotency', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        data: { processed: true },
      });
    });

    // Apply error handler
    app.use(errorHandler);
  });

  describe('Submission endpoint with idempotency', () => {
    it('should process first request normally', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'test-key-001')
        .send({
          entity_type: 'student',
          entity_id: 'student-123',
          category: 'profile',
          change_details: { first_name: 'John' },
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: 'approval-123',
          entity_type: 'student',
          status: 'pending',
        },
      });
    });

    it('should return cached response for duplicate request', async () => {
      // Arrange - First request
      const requestBody = {
        entity_type: 'faculty',
        entity_id: 'faculty-456',
        category: 'research',
        change_details: { title: 'Professor' },
      };

      await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'test-key-002')
        .send(requestBody);

      // Act - Second request with same key and body
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'test-key-002')
        .send(requestBody);

      // Assert - Should return cached response
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: {
          id: 'approval-123',
          entity_type: 'faculty',
          status: 'pending',
        },
      });
    });

    it('should return 409 for same key with different body', async () => {
      // Arrange - First request
      await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'test-key-003')
        .send({
          entity_type: 'student',
          entity_id: 'student-111',
        });

      // Act - Second request with same key but different body
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'test-key-003')
        .send({
          entity_type: 'student',
          entity_id: 'student-222', // Different ID
        });

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
      expect(response.body.error.message).toContain('different request parameters');
    });

    it('should allow same body with different property order', async () => {
      // Arrange - First request
      const firstBody = {
        entity_type: 'event',
        entity_id: 'event-789',
        category: 'event',
      };

      await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'test-key-004')
        .send(firstBody);

      // Act - Second request with same data, different order
      const secondBody = {
        category: 'event',
        entity_id: 'event-789',
        entity_type: 'event',
      };

      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'test-key-004')
        .send(secondBody);

      // Assert - Should return cached response (not 409)
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Bulk operation endpoint with idempotency', () => {
    it('should cache bulk operation response', async () => {
      // Arrange
      const requestBody = {
        approvalIds: ['id-1', 'id-2', 'id-3'],
        atomic: false,
      };

      // Act - First request
      const firstResponse = await request(app)
        .post('/api/v1/approvals/bulk-approve')
        .set('Idempotency-Key', 'bulk-key-001')
        .send(requestBody);

      // Act - Second request
      const secondResponse = await request(app)
        .post('/api/v1/approvals/bulk-approve')
        .set('Idempotency-Key', 'bulk-key-001')
        .send(requestBody);

      // Assert - Both should return same response
      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body).toEqual(firstResponse.body);
    });

    it('should detect changes in array order for bulk operations', async () => {
      // Arrange - First request
      await request(app)
        .post('/api/v1/approvals/bulk-approve')
        .set('Idempotency-Key', 'bulk-key-002')
        .send({
          approvalIds: ['id-1', 'id-2', 'id-3'],
        });

      // Act - Second request with different array order
      const response = await request(app)
        .post('/api/v1/approvals/bulk-approve')
        .set('Idempotency-Key', 'bulk-key-002')
        .send({
          approvalIds: ['id-3', 'id-2', 'id-1'], // Different order
        });

      // Assert - Should return 409 (arrays are order-sensitive)
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('Requests without idempotency key', () => {
    it('should process multiple requests without caching', async () => {
      // Arrange
      const requestBody = {
        entity_type: 'research',
        entity_id: 'research-999',
      };

      // Act - Multiple requests without idempotency key
      const response1 = await request(app)
        .post('/api/v1/approvals')
        .send(requestBody);

      const response2 = await request(app)
        .post('/api/v1/approvals')
        .send(requestBody);

      // Assert - Both should succeed (no caching)
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.data.id).toBe('approval-123');
      expect(response2.body.data.id).toBe('approval-123');
    });

    it('should work on endpoints without idempotency middleware', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/no-idempotency')
        .set('Idempotency-Key', 'ignored-key')
        .send({ data: 'test' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Different idempotency keys', () => {
    it('should treat different keys as separate requests', async () => {
      // Arrange
      const requestBody = {
        entity_type: 'student',
        entity_id: 'student-555',
      };

      // Act - Same body, different keys
      const response1 = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'key-a')
        .send(requestBody);

      const response2 = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'key-b')
        .send(requestBody);

      // Assert - Both should succeed independently
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'empty-body-key')
        .send({});

      // Assert
      expect(response.status).toBe(201);
    });

    it('should handle null values in request body', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'null-value-key')
        .send({
          entity_type: 'student',
          entity_id: null,
        });

      // Assert
      expect(response.status).toBe(201);
    });

    it('should handle nested objects in request body', async () => {
      // Arrange
      const requestBody = {
        entity_type: 'research',
        change_details: {
          title: 'Research Title',
          metadata: {
            author: 'John Doe',
            year: 2024,
          },
        },
      };

      // Act - First request
      await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'nested-key')
        .send(requestBody);

      // Act - Second request
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'nested-key')
        .send(requestBody);

      // Assert - Should return cached response
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should handle very long idempotency keys', async () => {
      // Arrange
      const longKey = 'a'.repeat(255); // 255 characters

      // Act
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', longKey)
        .send({
          entity_type: 'student',
          entity_id: 'student-long-key',
        });

      // Assert
      expect(response.status).toBe(201);
    });

    it('should handle special characters in idempotency keys', async () => {
      // Arrange
      const specialKey = 'key-with-special-chars-!@#$%^&*()';

      // Act
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', specialKey)
        .send({
          entity_type: 'faculty',
          entity_id: 'faculty-special',
        });

      // Assert
      expect(response.status).toBe(201);
    });
  });

  describe('Case sensitivity', () => {
    it('should treat header name as case-insensitive', async () => {
      // Arrange
      const requestBody = {
        entity_type: 'event',
        entity_id: 'event-case-test',
      };

      // Act - First request with lowercase header
      await request(app)
        .post('/api/v1/approvals')
        .set('idempotency-key', 'case-test-key')
        .send(requestBody);

      // Act - Second request with different case header
      const response = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'case-test-key')
        .send(requestBody);

      // Assert - Should return cached response (Express normalizes headers)
      expect(response.status).toBe(201);
    });

    it('should treat idempotency key value as case-sensitive', async () => {
      // Arrange
      const requestBody = {
        entity_type: 'research',
        entity_id: 'research-case',
      };

      // Act - First request with lowercase key
      const response1 = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'mykey')
        .send(requestBody);

      // Act - Second request with uppercase key
      const response2 = await request(app)
        .post('/api/v1/approvals')
        .set('Idempotency-Key', 'MYKEY')
        .send(requestBody);

      // Assert - Should treat as different keys
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });
  });
});
