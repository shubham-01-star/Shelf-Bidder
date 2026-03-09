/**
 * Production-ready logging utility
 * Replaces console.log statements with structured logging
 * Task 15.1: Comprehensive logging and monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface CloudWatchLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  environment: string;
  service: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';
  private serviceName = 'shelf-bidder';
  private logBuffer: CloudWatchLog[] = [];
  private readonly BUFFER_SIZE = 50;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    // Set up periodic flush in production
    if (!this.isDevelopment && !this.isTest) {
      setInterval(() => this.flush(), this.FLUSH_INTERVAL);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    // Suppress logs in test environment
    if (this.isTest) return;

    const timestamp = new Date().toISOString();
    const logData: CloudWatchLog = {
      timestamp,
      level,
      message,
      context,
      environment: process.env.NODE_ENV || 'development',
      service: this.serviceName,
    };

    // In production, buffer logs for batch sending
    if (!this.isDevelopment) {
      this.logBuffer.push(logData);
      
      // Flush if buffer is full
      if (this.logBuffer.length >= this.BUFFER_SIZE) {
        this.flush();
      }
      
      // Also output to console for CloudWatch Logs capture
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

  /**
   * Flush buffered logs to monitoring service
   */
  private flush() {
    if (this.logBuffer.length === 0) return;

    // TODO: Send to CloudWatch Logs or other monitoring service
    // For now, logs are already output to console which CloudWatch captures
    
    // Clear buffer
    this.logBuffer = [];
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

  /**
   * Log API request/response for monitoring
   */
  apiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext) {
    this.info('API Request', {
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }

  /**
   * Log workflow state transitions
   */
  workflowTransition(shopkeeperId: string, fromState: string, toState: string, context?: LogContext) {
    this.info('Workflow Transition', {
      shopkeeperId,
      fromState,
      toState,
      ...context,
    });
  }

  /**
   * Log auction events
   */
  auctionEvent(auctionId: string, event: string, context?: LogContext) {
    this.info('Auction Event', {
      auctionId,
      event,
      ...context,
    });
  }

  /**
   * Log task events
   */
  taskEvent(taskId: string, event: string, context?: LogContext) {
    this.info('Task Event', {
      taskId,
      event,
      ...context,
    });
  }

  /**
   * Log wallet transactions
   */
  walletTransaction(shopkeeperId: string, amount: number, type: string, context?: LogContext) {
    this.info('Wallet Transaction', {
      shopkeeperId,
      amount,
      type,
      ...context,
    });
  }
}

export const logger = new Logger();
