export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * Error dasar aplikasi. Membawa tiga hal yang dibutuhkan client:
 * - statusCode : status HTTP
 * - code       : kode mesin yang stabil (mis. EMAIL_TAKEN) — frontend memutuskan
 *                perilaku dari `code`, bukan dari teks `message`
 * - message    : kalimat untuk manusia
 * Subclass (NotFoundError, ForbiddenError, ...) menurun dari sini.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}
