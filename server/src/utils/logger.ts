import pino from 'pino';

// Logger structuré. En dev : sortie lisible si pino-pretty est présent, sinon JSON.
const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  base: { service: 'zentask-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
