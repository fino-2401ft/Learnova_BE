/** Shape of every error response. AllExceptionsFilter is what actually builds it. */
export interface ErrorResponseDto {
  success: false;
  statusCode: number;
  /** Stable code to branch on. Do not match against `message`. */
  code: string;
  /** Human-readable text. Wording may change at any time. */
  message: string;
  /** Validation errors only, one line per offending field. */
  details?: string[];
  path: string;
  timestamp: string;
}
