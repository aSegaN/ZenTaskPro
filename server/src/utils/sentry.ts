import * as Sentry from '@sentry/node';
import { logger } from './logger';

let enabled = false;

/**
 * Initialise Sentry si SENTRY_DSN est défini. Sinon, no-op (capture ignorée).
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry désactivé (aucun SENTRY_DSN)');
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
  });
  enabled = true;
  logger.info('Sentry initialisé');
}

/** Capture une exception vers Sentry si activé. */
export function captureException(err: unknown): void {
  if (enabled) Sentry.captureException(err);
}

export { Sentry };
