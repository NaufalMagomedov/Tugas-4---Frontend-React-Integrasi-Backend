import { Router } from 'express';
import { StallController } from '../controllers/stallController.ts';
import { ReviewController } from '../controllers/reviewController.ts';
import { MenuController } from '../controllers/menuController.ts';
import { validate } from '../middlewares/validate.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { createStallSchema, idParamSchema, stallQuerySchema, updateStallSchema } from '../schemas/stallSchema.ts';
import { createReviewSchema } from '../schemas/reviewSchema.ts';
import { createMenuSchema } from '../schemas/menuSchema.ts';

const stallRouter = Router();
const stallController = new StallController();
const reviewController = new ReviewController();
const menuController = new MenuController();

// Route publik. URUTAN PENTING: path statis (/categories, /mine) harus
// didaftarkan SEBELUM '/:id', kalau tidak "mine" dibaca sebagai id.
stallRouter.get('/', validate(stallQuerySchema, 'query'), stallController.getStalls);
stallRouter.get('/categories', stallController.getCategories);

// Route terlindungi. Urutan middleware: authenticate (sesi valid?) ->
// authorize (role cukup?) -> validate (input benar?). Authenticate paling
// depan membuat request tanpa sesi SELALU 401, apa pun isi body-nya.
stallRouter.get('/mine', authenticate, authorize('owner'), stallController.getMyStalls);

stallRouter.get('/:id', validate(idParamSchema, 'params'), stallController.getStallById);
stallRouter.get('/:id/menus', validate(idParamSchema, 'params'), stallController.getStallMenus);
stallRouter.get('/:id/reviews', validate(idParamSchema, 'params'), reviewController.getStallReviews);

stallRouter.post('/', authenticate, authorize('owner', 'admin'), validate(createStallSchema, 'body'), stallController.createStall);
stallRouter.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate(idParamSchema, 'params'),
  validate(updateStallSchema, 'body'),
  stallController.updateStall,
);
// Hapus warung: admin boleh semua, owner hanya miliknya sendiri (dicek service).
stallRouter.delete(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate(idParamSchema, 'params'),
  stallController.deleteStall,
);

// Menu milik warung. Role owner/admin saja belum cukup: service memeriksa
// bahwa warung ini memang milik user (STALL_FORBIDDEN bila bukan).
stallRouter.post(
  '/:id/menus',
  authenticate,
  authorize('owner', 'admin'),
  validate(idParamSchema, 'params'),
  validate(createMenuSchema, 'body'),
  menuController.createMenu,
);

stallRouter.post(
  '/:id/reviews',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(createReviewSchema, 'body'),
  reviewController.createReview,
);

export { stallRouter };
