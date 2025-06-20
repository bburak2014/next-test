import pino from 'pino';

interface LogMetadata {
  [key: string]: unknown;
}

interface AuthEventData extends LogMetadata {
  userId?: string;
  email?: string | null;
  role?: string;
  provider?: string;
}

interface ApiEventData extends LogMetadata {
  method: string;
  path: string;
  status: number;
  duration: number;
  userId?: string;
}

interface SecurityEventData extends LogMetadata {
  ip?: string;
  path?: string;
  method?: string;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'error' : 'debug'),
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard'
      }
    }
  }),
  ...(isProduction && {
    redact: ['password', 'email', 'token', 'authorization', 'cookie'],
    formatters: {
      level: (label) => ({ level: label })
    }
  })
});

const browserLogger = {
  info: () => {},
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: () => {}
};

export const logger = typeof window === 'undefined' ? pinoLogger : browserLogger;

export const logAuthEvent = (event: string, userId?: string, data?: AuthEventData) => {
  logger.info({ 
    type: 'auth', 
    event, 
    userId,
    ...data 
  });
};

export const logApiCall = (data: ApiEventData) => {
  if (data.status >= 500) {
    logger.error({ type: 'api', ...data });
  } else if (data.status >= 400) {
    logger.warn({ type: 'api', ...data });
  } else if (isDevelopment) {
    logger.info({ type: 'api', ...data });
  }
};

export const logError = (error: Error | unknown, context?: string) => {
  if (error instanceof Error) {
    logger.error({ 
      type: 'error',
      message: error.message,
      stack: isProduction ? undefined : error.stack,
      context 
    });
  } else {
    logger.error({ 
      type: 'error',
      error: String(error),
      context 
    });
  }
};

export const logSecurityEvent = (event: string, data: SecurityEventData) => {
  logger.warn({ 
    type: 'security',
    event,
    ...data 
  });
};