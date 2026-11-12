import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.ts';
import { validate } from '../middlewares/validate.ts';
import { authenticate } from '../middlewares/auth.ts';
import { idParamSchema } from '../schemas/stallSchema.ts';

const reviewRouter = Router();
const reviewController = new ReviewController();

// Semua role login boleh mencoba; ReviewService memastikan hanya penulis atau admin.
reviewRouter.delete('/:id', authenticate, validate(idParamSchema, 'params'), reviewController.deleteReview);

export { reviewRouter };
