const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  SESSION_SECRET: process.env.SESSION_SECRET ?? '',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',

  audit: {
    maxPages: parseInt(process.env.AUDIT_MAX_PAGES ?? '20', 10),
    maxDepth: parseInt(process.env.AUDIT_MAX_DEPTH ?? '3', 10),
    timeoutMs: parseInt(process.env.AUDIT_TIMEOUT_MS ?? '120000', 10),
    maxConcurrent: parseInt(process.env.AUDIT_MAX_CONCURRENT ?? '2', 10),
  },

  worker: {
    pollIntervalMs: parseInt(process.env.WORKER_POLL_INTERVAL_MS ?? '5000', 10),
  },

  get isProduction() {
    return this.NODE_ENV === 'production';
  },
} as const;

export default env;
