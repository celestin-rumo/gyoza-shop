import { HttpErrorResponse } from '@angular/common/http';

/** Extracts the backend's ApiError `code` from a failed HttpClient request, if present. */
export function apiErrorCode(error: unknown): string | undefined {
  return error instanceof HttpErrorResponse ? (error.error as { code?: string })?.code : undefined;
}
