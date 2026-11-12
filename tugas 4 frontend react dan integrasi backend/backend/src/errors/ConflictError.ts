import { AppError, type ErrorDetail } from './AppError.ts';

/**
 * 409 untuk benturan dengan keadaan data saat ini. Contoh code: EMAIL_TAKEN,
 * MENU_NAME_TAKEN, REVIEW_ALREADY_EXISTS, STALL_HAS_RELATIONS.
 */
export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT', details?: ErrorDetail[]) {
    super(409, code, message, details);
    this.name = 'ConflictError';
  }
}
