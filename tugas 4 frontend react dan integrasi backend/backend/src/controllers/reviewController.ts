import type { Request, Response } from 'express';
import { ReviewService } from '../services/reviewService.ts';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { IdParam } from '../schemas/stallSchema.ts';
import type { CreateReviewInput } from '../schemas/reviewSchema.ts';

export class ReviewController {
  private reviewService: ReviewService;

  constructor(reviewService: ReviewService = new ReviewService()) {
    this.reviewService = reviewService;
  }

  getStallReviews = async (_req: Request, res: Response): Promise<void> => {
    const { id: stallId } = getValidated<IdParam>(res, 'params');
    const data = await this.reviewService.getStallReviews(stallId);
    res.status(200).json({ status: 'success', data });
  };

  createReview = async (req: Request, res: Response): Promise<void> => {
    const { id: stallId } = getValidated<IdParam>(res, 'params');
    const body = getValidated<CreateReviewInput>(res, 'body');

    // Identitas penulis SELALU dari sesi login, tidak pernah dari body.
    const { id: userId } = getUser(req);

    const data = await this.reviewService.createReview(stallId, userId, body);
    res.status(201).json({ status: 'success', message: 'Review berhasil dikirim.', data });
  };

  deleteReview = async (req: Request, res: Response): Promise<void> => {
    const { id } = getValidated<IdParam>(res, 'params');
    await this.reviewService.deleteReview(id, getUser(req));
    res.status(204).end();
  };
}
