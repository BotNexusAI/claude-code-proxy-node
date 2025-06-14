import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  // Log basic request details
  logger.debug(`Request: ${req.method} ${req.path}`);
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    logger.debug(`Response: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    return originalSend.call(this, body);
  };
  
  next();
}