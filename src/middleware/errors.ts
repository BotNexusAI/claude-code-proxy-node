import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string | undefined;
}

export function errorHandler(err: ApiError | ZodError | Error, req: Request, res: Response, _next: NextFunction): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    
    logger.warn('Validation error', { errors: validationErrors, path: req.path });
    
    res.status(400).json({
      error: 'Validation Error',
      details: validationErrors,
    });
    return;
  }
  
  // Handle API errors
  if ('statusCode' in err && err.statusCode) {
    logger.warn('API error', { 
      statusCode: err.statusCode, 
      message: err.message, 
      path: req.path 
    });
    
    res.status(err.statusCode).json({
      error: err.message,
      code: 'code' in err ? err.code : undefined,
    });
    return;
  }
  
  // Handle unknown errors
  logger.error('Unexpected error', { 
    message: err.message, 
    stack: err.stack, 
    path: req.path 
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

export function createApiError(message: string, statusCode: number = 500, code: string | undefined = undefined): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}