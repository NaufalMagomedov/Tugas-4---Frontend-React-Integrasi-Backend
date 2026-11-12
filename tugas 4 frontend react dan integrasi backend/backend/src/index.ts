import { app } from './app.ts';
import { env } from './config/env.ts';
import { closeDb } from './db/index.ts';

const server = app.listen(env.port, () => {
  console.log(`Server berjalan di http://localhost:${env.port}`);
  console.log(`Health check : http://localhost:${env.port}/health`);
  console.log(`Dokumentasi  : http://localhost:${env.port}/docs`);
});

// Tutup server lalu pool database dengan rapi saat proses dihentikan.
function shutdown(signal: string): void {
  console.log(`Menerima ${signal}. Menutup server...`);

  server.close(() => {
    void closeDb()
      .catch((error: unknown) => console.error('Gagal menutup koneksi database:', error))
      .finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
