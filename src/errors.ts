export type ErrorCode = 'AUTH_REQUIRED' | 'AUTH_EXPIRED' | 'ACCESS_DENIED' | 'PINNER_DATA_ACCESS_DENIED' | 'RATE_LIMITED' | 'UPSTREAM_UNAVAILABLE' | 'INVALID_RESPONSE' | 'INVALID_REQUEST' | 'STORAGE_ERROR';
const messages: Record<ErrorCode, string> = {
  AUTH_REQUIRED: 'Connect your Pinterest account before using this tool.',
  AUTH_EXPIRED: 'Pinterest authorization expired or was revoked. Reconnect your account.',
  ACCESS_DENIED: 'Pinterest did not authorize this request. Check the granted read permissions.',
  PINNER_DATA_ACCESS_DENIED: 'Pinterest has not authorized this app to read the requested Pinner data. Non-business or other accounts may require additional Pinterest approval. Do not retry until access is resolved.',
  RATE_LIMITED: 'Pinterest rate limit reached. Wait before trying again.',
  UPSTREAM_UNAVAILABLE: 'Pinterest is temporarily unavailable. Try again later.',
  INVALID_RESPONSE: 'Pinterest returned an invalid or oversized response.',
  INVALID_REQUEST: 'Unsupported Pinterest request.',
  STORAGE_ERROR: 'Unable to access the encrypted credential store.'
};
export class PinterestError extends Error {
  constructor(public readonly code: ErrorCode, public readonly retryAfter?: number) {
    super(messages[code]); this.name = 'PinterestError';
  }
}
export function publicError(error: unknown): string {
  return error instanceof PinterestError ? `${error.code}: ${error.message}` : 'The request failed. No sensitive details were logged.';
}
