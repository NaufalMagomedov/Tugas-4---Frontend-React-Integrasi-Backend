import { AppError, type ErrorDetail } from './AppError.ts';

export type ValidationIssue = ErrorDetail;

/** Diturunkan dari ZodError oleh middleware validate. Memetakan ke HTTP 400. */
export class ValidationError extends AppError {
  constructor(
    public readonly issues: ValidationIssue[],
    message = 'Data yang dikirim tidak valid.',
  ) {
    super(400, 'VALIDATION_ERROR', message, issues);
    this.name = 'ValidationError';
  }
}
