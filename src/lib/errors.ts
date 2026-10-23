/**
 * Application error codes used across the system.
 * Maps to HTTP status codes in API responses.
 */
export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SSRF_BLOCKED'
  | 'AUDIT_LIMIT_EXCEEDED';

const HTTP_STATUS_MAP: Record<AppErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SSRF_BLOCKED: 422,
  AUDIT_LIMIT_EXCEEDED: 409,
};

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = HTTP_STATUS_MAP[code];
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

/**
 * Handles errors in API routes, returning standardized JSON responses.
 * Never exposes stack traces or internal details to the client.
 */
export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(error.toJSON(), { status: error.statusCode });
  }

  console.error('[API Error]', error);

  return Response.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocorreu um erro interno. Tente novamente mais tarde.',
      },
    },
    { status: 500 }
  );
}
