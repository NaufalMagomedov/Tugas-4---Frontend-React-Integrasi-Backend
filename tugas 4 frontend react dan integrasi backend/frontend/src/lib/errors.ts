import axios from 'axios'

export interface ApiErrorDetail {
  field: string
  message: string
}

interface ErrorEnvelope {
  code?: unknown
  message?: unknown
  errors?: unknown
  requestId?: unknown
}

/**
 * Satu bentuk error untuk seluruh aplikasi. Komponen tidak perlu tahu apakah
 * error berasal dari respons 4xx, timeout, atau koneksi putus: cukup baca
 * `status`, `code`, `message`, `details`, dan `requestId`.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: ApiErrorDetail[]
  readonly requestId?: string

  constructor(
    status: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
    requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }

  /** Error jaringan/timeout: server tidak pernah menjawab. */
  get isNetwork(): boolean {
    return this.status === 0
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toDetails(value: unknown): ApiErrorDetail[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) =>
    isObject(item) && typeof item.field === 'string' && typeof item.message === 'string'
      ? [{ field: item.field, message: item.message }]
      : [],
  )
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const response = error.response
    const data = isObject(response?.data) ? (response.data as ErrorEnvelope) : null
    const headerId = response?.headers?.['x-request-id']
    const requestId =
      (typeof data?.requestId === 'string' ? data.requestId : undefined) ??
      (typeof headerId === 'string' ? headerId : undefined)

    if (!response) {
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      return new ApiError(
        0,
        timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
        timedOut
          ? 'Server terlalu lama merespons. Coba lagi.'
          : 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.',
      )
    }

    return new ApiError(
      response.status,
      typeof data?.code === 'string' ? data.code : 'REQUEST_FAILED',
      typeof data?.message === 'string' ? data.message : 'Permintaan gagal diproses.',
      toDetails(data?.errors),
      requestId,
    )
  }

  if (error instanceof Error && error.message) return new ApiError(0, 'UNKNOWN_ERROR', error.message)
  return new ApiError(0, 'UNKNOWN_ERROR', 'Terjadi kesalahan yang tidak diketahui.')
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** Error per field dari backend -> { field: pesan } untuk ditampilkan di form. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {}

  for (const detail of toApiError(error).details) {
    if (result[detail.field] === undefined) result[detail.field] = detail.message
  }

  return result
}

/**
 * Pesan aman untuk toast/alert. Error 5xx tidak menampilkan detail server;
 * `requestId` hanya disertakan untuk 5xx supaya pengguna bisa melaporkannya.
 * Error 4xx (password salah, validasi, akses ditolak) sudah jelas dari
 * pesannya, jadi kode laporan tidak perlu ditampilkan.
 */
export function describeError(error: unknown): { message: string; requestId?: string } {
  const apiError = toApiError(error)
  const reportable = apiError.status >= 500
  return { message: apiError.message, requestId: reportable ? apiError.requestId : undefined }
}
