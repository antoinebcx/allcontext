/**
 * Logger type definitions
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface LoggerConfig {
  isDevelopment: boolean;
  isEnabled: boolean;
}

export interface LoggerInterface {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  group(label: string): void;
  groupEnd(): void;
  time(label: string): void;
  timeEnd(label: string): void;
  clear(): void;
  setEnabled(enabled: boolean): void;
}