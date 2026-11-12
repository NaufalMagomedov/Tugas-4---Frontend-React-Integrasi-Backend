// Harus diimpor PALING PERTAMA di setiap file test: config/env.ts membaca
// process.env saat modul dimuat dan menolak start tanpa JWT_SECRET & kredensial DB.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'rahasia-khusus-test-minimal-32-karakter!!';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'review_kantin_test';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.AUTH_COOKIE_NAME = 'kantin_session_test';
