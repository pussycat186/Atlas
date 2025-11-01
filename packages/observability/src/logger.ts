/**
 * Structured Logger with Pino
 * Logs crypto operations, auth events, and security incidents
 */

import pino, { type Logger } from 'pino';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  operation?: string;
  component?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

export interface CryptoLogContext extends LogContext {
  algorithm?: string;
  keyId?: string;
  recipientId?: string;
  groupId?: string;
}

export interface SecurityEvent {
  type: 'auth_success' | 'auth_failure' | 'key_rotation' | 'breach_detected' | 'policy_violation' | 'rate_limit';
  severity: 'info' | 'warn' | 'error' | 'critical';
  details: Record<string, unknown>;
}

/**
 * Create structured logger
 */
export function createLogger(name: string): Logger {
  return pino({
    name,
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level(label) {
        return { level: label };
      },
      bindings(bindings) {
        return {
          pid: bindings.pid,
          hostname: bindings.hostname,
          node_version: process.version,
        };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  });
}

/**
 * Log crypto operation
 */
export function logCryptoOperation(
  logger: Logger,
  operation: string,
  context: CryptoLogContext,
  result: 'success' | 'failure',
  duration?: number
): void {
  const logEntry = {
    operation,
    result,
    duration_ms: duration,
    ...context,
  };

  if (result === 'success') {
    logger.info(logEntry, `Crypto operation: ${operation}`);
  } else {
    logger.error(logEntry, `Crypto operation failed: ${operation}`);
  }
}

/**
 * Log security event
 */
export function logSecurityEvent(logger: Logger, event: SecurityEvent): void {
  const logEntry = {
    event_type: event.type,
    severity: event.severity,
    ...event.details,
    timestamp: new Date().toISOString(),
  };

  switch (event.severity) {
    case 'critical':
      logger.fatal(logEntry, `CRITICAL SECURITY EVENT: ${event.type}`);
      break;
    case 'error':
      logger.error(logEntry, `Security event: ${event.type}`);
      break;
    case 'warn':
      logger.warn(logEntry, `Security warning: ${event.type}`);
      break;
    default:
      logger.info(logEntry, `Security event: ${event.type}`);
  }
}

/**
 * Log audit trail
 */
export function logAudit(
  logger: Logger,
  action: string,
  userId: string,
  resource: string,
  result: 'allowed' | 'denied',
  metadata?: Record<string, unknown>
): void {
  logger.info(
    {
      audit: true,
      action,
      user_id: userId,
      resource,
      result,
      ...metadata,
      timestamp: new Date().toISOString(),
    },
    `Audit: ${action} ${result} for user ${userId}`
  );
}

export const logger = createLogger('atlas');
