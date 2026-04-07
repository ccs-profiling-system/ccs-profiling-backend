import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../errors';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 * 
 * Implements Requirements 21.1, 21.2
 * 
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate ('body', 'query', 'params')
 * @returns Express middleware function
 * 
 * @example
 * const createStudentSchema = z.object({
 *   student_id: z.string().min(1),
 *   first_name: z.string().min(1),
 *   email: z.string().email(),
 * });
 * 
 * router.post('/students', validate(createStudentSchema, 'body'), controller.create);
 */
export function validate(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate the specified part of the request
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const validated = schema.parse(req[source]);
      
      // Replace the request data with validated data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      (req as any)[source] = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors into a user-friendly structure
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        // Throw ValidationError which will be caught by error handler
        next(
          new ValidationError('Validation failed', {
            errors: details,
          })
        );
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate multiple parts of the request
 * 
 * @param schemas - Object mapping request parts to their schemas
 * @returns Express middleware function
 * 
 * @example
 * validateMultiple({
 *   body: createStudentSchema,
 *   params: z.object({ id: z.string().uuid() })
 * })
 */
export function validateMultiple(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const errors: Array<{ source: string; field: string; message: string }> = [];

      // Validate each specified part
      for (const [source, schema] of Object.entries(schemas)) {
        if (schema) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const validated = schema.parse(req[source as keyof Request]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            (req as any)[source] = validated;
          } catch (error) {
            if (error instanceof ZodError) {
              error.errors.forEach((err) => {
                errors.push({
                  source,
                  field: err.path.join('.'),
                  message: err.message,
                });
              });
            }
          }
        }
      }

      if (errors.length > 0) {
        next(
          new ValidationError('Validation failed', {
            errors,
          })
        );
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
}
