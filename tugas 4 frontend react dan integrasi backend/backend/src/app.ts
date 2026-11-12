import cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import { sql } from 'drizzle-orm';
import swaggerUi from 'swagger-ui-express';
import { isProduction } from './config/env.ts';
import { getDb } from './db/index.ts';
import { openApiDocument } from './docs/openapi.ts';
import { corsMiddleware } from './middlewares/cors.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { notFoundHandler } from './middlewares/notFound.ts';
import { originGuard } from './middlewares/originGuard.ts';
import { requestId } from './middlewares/requestId.ts';
import { adminRouter } from './routes/adminRouter.ts';
import { authRouter } from './routes/authRouter.ts';
import { devRouter } from './routes/devRouter.ts';
import { menuRouter } from './routes/menuRouter.ts';
import { reviewRouter } from './routes/reviewRouter.ts';
import { stallRouter } from './routes/stallRouter.ts';
import { uploadRouter } from './routes/uploadRouter.ts';
import { UPLOAD_URL_PREFIX, uploadsDir } from './utils/uploadStorage.ts';

const app: Application = express();

// URUTAN MIDDLEWARE MENENTUKAN PERILAKU:
// requestId dulu (agar setiap error punya id) -> cors (agar preflight terjawab)
// -> parser body & cookie -> originGuard -> router -> 404 -> errorHandler.
app.disable('x-powered-by');
app.use(requestId);
app.use(corsMiddleware);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(originGuard);

// Spek OpenAPI mentah (untuk Postman). Wajib sebelum swaggerUi.serve karena
// swagger-ui-express menangkap semua path di bawah /docs.
app.get('/docs/swagger.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Gambar unggahan (cover warung, foto menu) disajikan sebagai file statis.
// Nama file acak dan tidak bisa diubah, jadi cache panjang aman dipakai.
app.use(UPLOAD_URL_PREFIX, express.static(uploadsDir, { maxAge: '30d', immutable: true, index: false }));

app.get('/health', async (req, res) => {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1 AS ok`);
    res.status(200).json({
      status: 'success',
      message: 'Server dan database terhubung.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Detail error hanya ke log; client menerima pesan generik + requestId.
    console.error(`[${req.requestId}] Health check gagal:`, error);
    res.status(500).json({
      status: 'error',
      code: 'DATABASE_ERROR',
      message: 'Gagal terhubung ke database.',
      requestId: req.requestId,
    });
  }
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/stalls', stallRouter);
app.use('/api/v1/menus', menuRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/uploads', uploadRouter);
app.use('/api/v1/admin', adminRouter);

// Endpoint bantu pengujian error. Tidak didaftarkan di production.
if (!isProduction) {
  app.use('/api/v1/dev', devRouter);
}

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
