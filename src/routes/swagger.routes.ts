/**
 * Swagger Documentation Routes
 * 
 * Serves the OpenAPI/Swagger documentation UI and JSON specification.
 * 
 * Requirements: 24.1, 24.2, 24.3, 24.4
 */

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

export const swaggerRoutes = Router();

// Serve Swagger UI at /api-docs
swaggerRoutes.use('/', swaggerUi.serve);
swaggerRoutes.get('/', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CCS Backend API Documentation',
}));

// Serve raw OpenAPI JSON specification at /api-docs/json
swaggerRoutes.get('/json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
