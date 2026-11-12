import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi. Salin .env.example ke .env.`);
  }

  return value;
}

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} harus berupa angka bulat positif.`);
  }

  return value;
}

/**
 * Semua konfigurasi dibaca SATU kali di sini. File lain mengimpor `env`,
 * tidak ada lagi `process.env.X` yang tersebar di banyak tempat.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV?.trim() || 'development',
  port: numberFromEnv('PORT', 3000),
  corsOrigin: (process.env.CORS_ORIGIN?.trim() || 'http://localhost:5173').replace(/\/$/, ''),
  authCookieName: process.env.AUTH_COOKIE_NAME?.trim() || 'kantin_session_ho3',
  // Tanpa nilai default: lupa mengisi harus berhenti dengan pesan jelas,
  // bukan diam-diam menandatangani token dengan string tebakan.
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '2h',
  bcryptSaltRounds: numberFromEnv('BCRYPT_SALT_ROUNDS', 10),
  db: {
    server: process.env.DB_SERVER?.trim() || 'localhost',
    port: numberFromEnv('DB_PORT', 1433),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
} as const;

export const isProduction = env.nodeEnv === 'production';
