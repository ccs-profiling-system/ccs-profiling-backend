import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateMultiple } from './validator';
import { ValidationError } from '../errors';

describe('Validation Middleware', () => {
  describe('validate', () => {
    it('should pass validation for valid body data', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().positive(),
      });

      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 25,
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      });
    });

    it('should pass validation for valid query data', () => {
      const schema = z.object({
        page: z.string(),
        limit: z.string(),
      });

      const req = {
        query: {
          page: '1',
          limit: '10',
        },
      } as any;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'query')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query).toEqual({
        page: '1',
        limit: '10',
      });
    });

    it('should pass validation for valid params data', () => {
      const schema = z.object({
        id: z.string().uuid(),
      });

      const req = {
        params: {
          id: '123e4567-e89b-12d3-a456-426614174000',
        },
      } as any;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'params')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.params.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should fail validation for invalid body data', () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().positive(),
      });

      const req = {
        body: {
          name: '',
          email: 'invalid-email',
          age: -5,
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details.errors).toHaveLength(3);
    });

    it('should format validation errors with field paths', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
          email: z.string().email(),
        }),
      });

      const req = {
        body: {
          user: {
            name: '',
            email: 'invalid',
          },
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'user.name',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'user.email',
            message: expect.any(String),
          }),
        ])
      );
    });

    it('should strip unknown fields when using strict schema', () => {
      const schema = z
        .object({
          name: z.string(),
          email: z.string().email(),
        })
        .strict();

      const req = {
        body: {
          name: 'John',
          email: 'john@example.com',
          unknown: 'field',
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should apply default values from schema', () => {
      const schema = z.object({
        name: z.string(),
        status: z.string().default('active'),
      });

      const req = {
        body: {
          name: 'John',
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).toEqual({
        name: 'John',
        status: 'active',
      });
    });

    it('should handle missing required fields', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      const req = {
        body: {
          name: 'John',
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          }),
        ])
      );
    });

    it('should handle array validation', () => {
      const schema = z.object({
        tags: z.array(z.string().min(1)),
      });

      const req = {
        body: {
          tags: ['tag1', 'tag2', 'tag3'],
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle enum validation', () => {
      const schema = z.object({
        role: z.enum(['admin', 'student', 'faculty']),
      });

      const req = {
        body: {
          role: 'admin',
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body.role).toBe('admin');
    });

    it('should fail enum validation for invalid value', () => {
      const schema = z.object({
        role: z.enum(['admin', 'student', 'faculty']),
      });

      const req = {
        body: {
          role: 'invalid',
        },
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      validate(schema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateMultiple', () => {
    it('should validate multiple request parts successfully', () => {
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

      const req = {
        params: {
          id: '123e4567-e89b-12d3-a456-426614174000',
        },
        body: {
          name: 'John Doe',
        },
        query: {
          include: 'details',
        },
      } as any;

      const res = {} as Response;
      const next = vi.fn();

      validateMultiple(schemas)(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.params.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(req.body.name).toBe('John Doe');
      expect(req.query.include).toBe('details');
    });

    it('should collect errors from multiple request parts', () => {
      const schemas = {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          name: z.string().min(1),
        }),
      };

      const req = {
        params: {
          id: 'invalid-uuid',
        },
        body: {
          name: '',
        },
      } as any;

      const res = {} as Response;
      const next = vi.fn();

      validateMultiple(schemas)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details.errors).toHaveLength(2);
      expect(error.details.errors).toEqual(
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

    it('should validate only specified parts', () => {
      const schemas = {
        body: z.object({
          name: z.string().min(1),
        }),
      };

      const req = {
        params: {
          id: 'not-validated',
        },
        body: {
          name: 'John Doe',
        },
      } as any;

      const res = {} as Response;
      const next = vi.fn();

      validateMultiple(schemas)(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body.name).toBe('John Doe');
      expect(req.params.id).toBe('not-validated');
    });

    it('should handle empty schemas object', () => {
      const req = {
        body: { anything: 'goes' },
      } as any;

      const res = {} as Response;
      const next = vi.fn();

      validateMultiple({})(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
