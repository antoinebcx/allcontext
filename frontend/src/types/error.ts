/**
 * Error type definitions for the application
 */

export type ErrorType =
  | 'NetworkError'
  | 'ValidationError'
  | 'AuthError'
  | 'NotFoundError'
  | 'ServerError'
  | 'TimeoutError'
  | 'UnknownError';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error | unknown;
  statusCode?: number;
  context?: Record<string, any>;
}

export interface ErrorMessages {
  NetworkError: string;
  ValidationError: string;
  AuthError: string;
  NotFoundError: string;
  ServerError: string;
  TimeoutError: string;
  UnknownError: string;
}