/**
 * Simple logger utility that only logs in development
 * In production, all console methods are no-ops to keep console clean
 */

import type { LogLevel, LogContext, LoggerInterface } from '../types/logger';

class Logger implements LoggerInterface {
  private isDevelopment: boolean;
  private isEnabled: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    // Can be disabled even in dev via localStorage
    this.isEnabled = this.isDevelopment && localStorage.getItem('disableLogging') !== 'true';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        console.debug(`${prefix} ${message}`, context || '');
        break;
      case 'info':
        console.info(`${prefix} ${message}`, context || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, context || '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, context || '');
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.formatMessage('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.formatMessage('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.formatMessage('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    // Always log errors in development, even if logging is disabled
    if (this.isDevelopment) {
      this.formatMessage('error', message, context);
    }

    // In production, we might want to send to error tracking service
    // Example: Sentry.captureException(new Error(message));
  }

  // Group related logs
  group(label: string): void {
    if (this.isEnabled) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isEnabled) {
      console.groupEnd();
    }
  }

  // Performance logging
  time(label: string): void {
    if (this.isEnabled) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isEnabled) {
      console.timeEnd(label);
    }
  }

  // Clear console (dev only)
  clear(): void {
    if (this.isEnabled) {
      console.clear();
    }
  }

  // Enable/disable logging dynamically
  setEnabled(enabled: boolean): void {
    this.isEnabled = this.isDevelopment && enabled;
    localStorage.setItem('disableLogging', (!enabled).toString());
  }
}

// Create singleton instance
export const logger = new Logger();

// Export for use in error boundaries and global error handlers
export const logError = (error: Error | unknown, context?: LogContext): void => {
  if (error instanceof Error) {
    logger.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
    });
  } else {
    logger.error('Unknown error occurred', {
      ...context,
      error: String(error),
    });
  }
};

// Export for performance monitoring
export const logPerformance = (operation: string, startTime: number): void => {
  const duration = performance.now() - startTime;
  logger.debug(`${operation} completed`, {
    duration: `${duration.toFixed(2)}ms`,
  });
};
