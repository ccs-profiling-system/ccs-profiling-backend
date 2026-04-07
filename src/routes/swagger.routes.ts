/**
 * Swagger Documentation Routes
 * 
 * Serves the OpenAPI/Swagger documentation UI and JSON specification.
 * 
 */

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

export const swaggerRoutes = Router();

// Serve raw OpenAPI JSON specification at /api-docs/json
swaggerRoutes.get('/json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI at /api-docs
swaggerRoutes.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CCS Backend API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  },
}));
