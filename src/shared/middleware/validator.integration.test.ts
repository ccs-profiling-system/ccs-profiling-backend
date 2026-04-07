import { describe, it, expect } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate, validateMultiple } from './validator';
import { errorHandler } from './errorHandler';

describe('Validator Integration Tests', () => {
  let app: Express;

  const setupApp = () => {
    const testApp = express();
    testApp.use(express.json());
    return testApp;
  };

  describe('validate middleware with error handler', () => {
    it('should validate and pass valid request body', async () => {
      app = setupApp();

      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().positive(),
      });

      app.post('/test', validate(schema, 'body'), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      app.use(errorHandler);

      const response = await request(app).post('/test').send({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 25,
        },
      });
    });

    it('should return validation error for invalid request body', async () => {
      app = setupApp();

      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().positive(),
      });

      app.post('/test', validate(schema, 'body'), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      app.use(errorHandler);

      const response = await request(app).post('/test').send({
        name: '',
        email: 'invalid-email',
        age: -5,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Validation failed');
      expect(response.body.error.details.errors).toHaveLength(3);
      expect(response.body.error.timestamp).toBeDefined();
    });

    it('should validate query parameters', async () => {
      app = setupApp();

      const schema = z.object({
        page: z.string().regex(/^\d+$/),
        limit: z.string().regex(/^\d+$/),
      });

      app.get('/test', validate(schema, 'query'), (req, res) => {
        res.json({ success: true, data: req.query });
      });

      app.use(errorHandler);

      const response = await request(app).get('/test?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        page: '1',
        limit: '10',
      });
    });

    it('should return validation error for invalid query parameters', async () => {
      app = setupApp();

      const schema = z.object({
        page: z.string().regex(/^\d+$/),
        limit: z.string().regex(/^\d+$/),
      });

      app.get('/test', validate(schema, 'query'), (req, res) => {
        res.json({ success: true, data: req.query });
      });

      app.use(errorHandler);

      const response = await request(app).get('/test?page=invalid&limit=abc');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.errors).toHaveLength(2);
    });

    it('should validate route parameters', async () => {
      app = setupApp();

      const schema = z.object({
        id: z.string().uuid(),
      });

      app.get('/test/:id', validate(schema, 'params'), (req, res) => {
        res.json({ success: true, data: req.params });
      });

      app.use(errorHandler);

      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app).get(`/test/${validUuid}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(validUuid);
    });

    it('should return validation error for invalid route parameters', async () => {
      app = setupApp();

      const schema = z.object({
        id: z.string().uuid(),
      });

      app.get('/test/:id', validate(schema, 'params'), (req, res) => {
        res.json({ success: true, data: req.params });
      });

      app.use(errorHandler);

      const response = await request(app).get('/test/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should apply schema transformations and defaults', async () => {
      app = setupApp();

      const schema = z.object({
        name: z.string().trim(),
        status: z.string().default('active'),
        age: z.string().transform((val) => parseInt(val, 10)),
      });

      app.post('/test', validate(schema, 'body'), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      app.use(errorHandler);

      const response = await request(app).post('/test').send({
        name: '  John Doe  ',
        age: '25',
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        name: 'John Doe',
        status: 'active',
        age: 25,
      });
    });
  });

  describe('validateMultiple middleware with error handler', () => {
    it('should validate multiple request parts successfully', async () => {
      app = setupApp();

      const schemas = {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          name: z.string().min(1),
        }),
        query: z.object({
          include: z.string().optional(),
        }),
      };

      app.put('/test/:id', validateMultiple(schemas), (req, res) => {
        res.json({
          success: true,
          data: {
            params: req.params,
            body: req.body,
            query: req.query,
          },
        });
      });

      app.use(errorHandler);

      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .put(`/test/${validUuid}?include=details`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.params.id).toBe(validUuid);
      expect(response.body.data.body.name).toBe('Updated Name');
      expect(response.body.data.query.include).toBe('details');
    });

    it('should collect validation errors from multiple request parts', async () => {
      app = setupApp();

      const schemas = {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          name: z.string().min(1),
        }),
      };

      app.put('/test/:id', validateMultiple(schemas), (req, res) => {
        res.json({ success: true });
      });

      app.use(errorHandler);

      const response = await request(app).put('/test/invalid-uuid').send({
        name: '',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.errors).toHaveLength(2);
      
      const errors = response.body.error.details.errors;
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'params',
            field: 'id',
          }),
          expect.objectContaining({
            source: 'body',
            field: 'name',
          }),
        ])
      );
    });
  });

  describe('real-world validation scenarios', () => {
    it('should validate student creation request', async () => {
      app = setupApp();

      const createStudentSchema = z.object({
        student_id: z.string().min(1),
        first_name: z.string().min(1),
        last_name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        year_level: z.number().int().min(1).max(5).optional(),
        program: z.string().optional(),
      });

      app.post('/students', validate(createStudentSchema, 'body'), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      app.use(errorHandler);

      const response = await request(app).post('/students').send({
        student_id: '2021-00001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        year_level: 3,
        program: 'BSCS',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid student creation request', async () => {
      app = setupApp();

      const createStudentSchema = z.object({
        student_id: z.string().min(1),
        first_name: z.string().min(1),
        last_name: z.string().min(1),
        email: z.string().email(),
        year_level: z.number().int().min(1).max(5).optional(),
      });

      app.post('/students', validate(createStudentSchema, 'body'), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      app.use(errorHandler);

      const response = await request(app).post('/students').send({
        student_id: '',
        first_name: 'John',
        last_name: '',
        email: 'invalid-email',
        year_level: 10,
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.errors.length).toBeGreaterThan(0);
    });

    it('should validate pagination query parameters', async () => {
      app = setupApp();

      const paginationSchema = z.object({
        page: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)).default('1'),
        limit: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)).default('10'),
        search: z.string().optional(),
      });

      app.get('/students', validate(paginationSchema, 'query'), (req, res) => {
        res.json({ success: true, data: req.query });
      });

      app.use(errorHandler);

      const response = await request(app).get('/students?page=2&limit=20&search=john');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        page: 2,
        limit: 20,
        search: 'john',
      });
    });

    it('should validate enum values', async () => {
      app = setupApp();

      const updateStatusSchema = z.object({
        status: z.enum(['active', 'inactive', 'graduated']),
      });

      app.patch('/students/:id/status', validate(updateStatusSchema, 'body'), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      app.use(errorHandler);

      const response = await request(app)
        .patch('/students/123/status')
        .send({ status: 'active' });

      expect(response.status).toBe(200);
    });

    it('should reject invalid enum values', async () => {
      app = setupApp();

      const updateStatusSchema = z.object({
        status: z.enum(['active', 'inactive', 'graduated']),
      });

      app.patch('/students/:id/status', validate(updateStatusSchema, 'body'), (req, res) => {
        res.json({ success: true, data: req.body });
      });

      app.use(errorHandler);

      const response = await request(app)
        .patch('/students/123/status')
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
