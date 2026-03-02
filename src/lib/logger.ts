/**
 * Production-ready logging utility
 * Replaces console.log statements with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';

  private log(level: LogLevel, message: string, context?: LogContext) {
    // Suppress logs in test environment
    if (this.isTest) return;

    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In production, send to monitoring service
    if (!this.isDevelopment) {
      // TODO: Send to CloudWatch Logs or monitoring service
      // For now, use structured console output
      console.log(JSON.stringify(logData));
      return;
    }

    // Development: Pretty print
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, context || '');
        break;
      case 'warn':
        console.warn(prefix, message, context || '');
        break;
      case 'info':
        console.info(prefix, message, context || '');
        break;
      case 'debug':
        console.debug(prefix, message, context || '');
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    this.log('error', message, errorContext);
  }
}

export const logger = new Logger();
