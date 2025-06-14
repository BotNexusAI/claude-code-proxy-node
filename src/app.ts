import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { requestLoggingMiddleware } from './middleware/logging.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { messagesRouter } from './routes/messages.js';
import { healthRouter } from './routes/health.js';

export function createApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API
  }));

  // CORS
  app.use(cors({
    origin: true, // Allow all origins for API
    credentials: true,
  }));

  // Compression
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded, please try again later',
    },
  });
  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  app.use(requestLoggingMiddleware);

  // Routes
  app.use('/v1/messages', messagesRouter);
  app.use('/', healthRouter);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      message: 'Anthropic API Proxy for Node.js',
      version: '1.0.0',
      endpoints: {
        messages: '/v1/messages',
        count_tokens: '/v1/messages/count_tokens',
        health: '/health',
      },
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}