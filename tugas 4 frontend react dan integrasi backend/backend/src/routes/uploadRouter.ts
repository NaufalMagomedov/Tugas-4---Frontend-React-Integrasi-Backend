import express, { Router } from 'express';
import { UploadController } from '../controllers/uploadController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { MAX_IMAGE_BYTES } from '../utils/uploadStorage.ts';

const uploadRouter = Router();
const uploadController = new UploadController();

/**
 * Menerima body biner gambar. Tipe selain gambar tidak diparse sehingga
 * controller melihat body kosong dan membalas 400 (bukan error parser).
 * Batas ukuran ditegakkan di sini sekaligus diverifikasi ulang di storage.
 */
const rawImage = express.raw({
  type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  limit: MAX_IMAGE_BYTES,
});

// Hanya owner/admin yang boleh mengunggah, karena gambar dipakai untuk
// mengubah data warung/menu.
uploadRouter.post('/', authenticate, authorize('owner', 'admin'), rawImage, uploadController.uploadImage);

export { uploadRouter };
