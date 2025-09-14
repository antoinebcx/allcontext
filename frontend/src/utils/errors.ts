/**
 * Error utilities for consistent error handling and user-friendly messages
 */

import type { AxiosError } from 'axios';
import type { ErrorType, AppError, ErrorMessages } from '../types/error';

// User-friendly error messages
const ERROR_MESSAGES: ErrorMessages = {
  NetworkError: 'Connection issue. Please check your internet and try again.',
  ValidationError: 'Please check your input and try again.',
  AuthError: 'Please sign in to continue.',
  NotFoundError: 'The requested resource was not found.',
  ServerError: 'Something went wrong on our end. Please try again later.',
  TimeoutError: 'The request took too long. Please try again.',
  UnknownError: 'An unexpected error occurred. Please try again.',
};

/**
 * Parse error and return user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return ERROR_MESSAGES.UnknownError;

  // Handle Axios errors
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as any;
    const message = data?.detail || data?.message;

    if (message && typeof message === 'string') {
      return message;
    }

    switch (status) {
      case 400:
        return ERROR_MESSAGES.ValidationError;
      case 401:
        return ERROR_MESSAGES.AuthError;
      case 404:
        return ERROR_MESSAGES.NotFoundError;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.ServerError;
      default:
        if (!error.response) {
          return ERROR_MESSAGES.NetworkError;
        }
        return ERROR_MESSAGES.UnknownError;
    }
  }

  // Handle standard Error objects
  if (typeof error === 'object' && error !== null && error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('Network')) {
      return ERROR_MESSAGES.NetworkError;
    }
    if (error.message.includes('timeout')) {
      return ERROR_MESSAGES.TimeoutError;
    }
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return ERROR_MESSAGES.AuthError;
    }

    // Return the error message if it seems user-friendly
    if (error.message.length < 100 && !error.message.includes('Error:')) {
      return error.message;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return ERROR_MESSAGES.UnknownError;
}

/**
 * Determine error type from error object
 */
export function getErrorType(error: unknown): ErrorType {
  if (!error) return 'UnknownError';

  if (isAxiosError(error)) {
    const status = error.response?.status;

    if (!error.response) {
      return 'NetworkError';
    }

    switch (status) {
      case 400:
        return 'ValidationError';
      case 401:
        return 'AuthError';
      case 404:
        return 'NotFoundError';
      case 500:
      case 502:
      case 503:
        return 'ServerError';
      default:
        return 'UnknownError';
    }
  }

  if (typeof error === 'object' && error !== null && error instanceof Error) {
    if (error.message.includes('Network')) {
      return 'NetworkError';
    }
    if (error.message.includes('timeout')) {
      return 'TimeoutError';
    }
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return 'AuthError';
    }
  }

  return 'UnknownError';
}

/**
 * Create a standardized app error
 */
export function createAppError(
  error: unknown,
  context?: Record<string, any>
): AppError {
  const type = getErrorType(error);
  const message = getErrorMessage(error);

  let statusCode: number | undefined;
  if (isAxiosError(error)) {
    statusCode = error.response?.status;
  }

  return {
    type,
    message,
    originalError: error,
    statusCode,
    context,
  };
}

/**
 * Check if error is an Axios error
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as any).isAxiosError === true
  );
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorType = getErrorType(error);

  // These errors are typically retryable
  const retryableTypes: ErrorType[] = [
    'NetworkError',
    'ServerError',
    'TimeoutError',
  ];

  return retryableTypes.includes(errorType);
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, any> {
  if (isAxiosError(error)) {
    return {
      type: 'AxiosError',
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message,
    };
  }

  if (typeof error === 'object' && error !== null && error instanceof Error) {
    return {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    type: typeof error,
    value: error,
  };
}
