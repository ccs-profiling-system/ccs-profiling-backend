import express from 'express';
import cors from 'cors';
import { config } from './config';
import { routes } from './routes';
import { errorHandler } from './shared/middleware/errorHandler';

export const app = express();

// Middleware
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);
