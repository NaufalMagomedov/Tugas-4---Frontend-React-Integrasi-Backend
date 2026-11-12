/**
 * Mencari nomor error SQL Server di dalam rantai error.
 *
 * Drizzle membungkus error driver (`cause`), dan mssql membungkusnya lagi
 * (`originalError`). Membaca `error.number` saja akan melewatkan error yang
 * terbungkus, sehingga unique/foreign-key violation berubah jadi 500.
 *
 *   2627 / 2601 = unique violation
 *   547         = foreign key / constraint violation
 */
export function getSqlErrorNumber(error: unknown): number | undefined {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth += 1) {
    const candidate = current as {
      number?: unknown;
      cause?: unknown;
      originalError?: unknown;
    };

    if (typeof candidate.number === 'number') return candidate.number;
    current = candidate.cause ?? candidate.originalError;
  }

  return undefined;
}

export const isUniqueViolation = (error: unknown): boolean => {
  const code = getSqlErrorNumber(error);
  return code === 2627 || code === 2601;
};

export const isForeignKeyViolation = (error: unknown): boolean => getSqlErrorNumber(error) === 547;
