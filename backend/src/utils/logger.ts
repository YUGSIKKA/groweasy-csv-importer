import { pino } from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

export const logger = pino(
  isDevelopment
    ? {
        transport: {
          target: 'pino-pretty'
        }
      }
    : {}
);
