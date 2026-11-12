import { ReviewRepository } from '../repositories/reviewRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import type { ReviewListItemDto, ReviewResponseDto } from '../dtos/reviewDto.ts';
import { AppError } from '../errors/AppError.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import type { CreateReviewInput } from '../schemas/reviewSchema.ts';
import { isForeignKeyViolation } from '../utils/sqlError.ts';
import { canDeleteReview } from './ownership.ts';
import type { AuthUser } from './tokenService.ts';

type ReviewRow = NonNullable<Awaited<ReturnType<ReviewRepository['create']>>>;

const stallNotFound = () => new NotFoundError('Warung tidak ditemukan.', 'STALL_NOT_FOUND');
const reviewNotFound = () => new NotFoundError('Review tidak ditemukan.', 'REVIEW_NOT_FOUND');

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private stallRepository: StallRepository;

  constructor(
    reviewRepository: ReviewRepository = new ReviewRepository(),
    stallRepository: StallRepository = new StallRepository(),
  ) {
    this.reviewRepository = reviewRepository;
    this.stallRepository = stallRepository;
  }

  private toDto(row: ReviewRow): ReviewResponseDto {
    return {
      id: row.id,
      stallId: row.stallId,
      userId: row.userId,
      rating: row.rating,
      comment: row.comment,
      likeCount: row.likeCount,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    };
  }

  async getStallReviews(stallId: number): Promise<ReviewListItemDto[]> {
    const stall = await this.stallRepository.findById(stallId);
    if (!stall) throw stallNotFound();

    const rows = await this.reviewRepository.findByStall(stallId);
    return rows.map((row) => ({
      id: row.id,
      stallId: row.stallId,
      userId: row.userId,
      userName: row.userName,
      rating: row.rating,
      comment: row.comment,
      likeCount: row.likeCount,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    }));
  }

  /** `userId` dari sesi login, bukan dari body — client tidak bisa menulis atas nama orang lain. */
  async createReview(stallId: number, userId: number, input: CreateReviewInput): Promise<ReviewResponseDto> {
    const stall = await this.stallRepository.findById(stallId);
    if (!stall) throw stallNotFound();

    const existing = await this.reviewRepository.findByStallAndUser(stallId, userId);
    if (existing) {
      throw new ConflictError('Kamu sudah pernah memberi review untuk warung ini.', 'REVIEW_ALREADY_EXISTS');
    }

    const row = await this.reviewRepository.create({
      stallId,
      userId,
      rating: input.rating,
      comment: input.comment ?? null,
    });
    if (!row) throw new AppError(500, 'REVIEW_NOT_SAVED', 'Review gagal disimpan.');

    // Rating warung ikut diperbarui supaya angka di STALLS tidak basi.
    await this.reviewRepository.refreshStallSummary(stallId);

    return this.toDto(row);
  }

  async deleteReview(id: number, user: AuthUser): Promise<ReviewResponseDto> {
    const current = await this.reviewRepository.findById(id);
    if (!current) throw reviewNotFound();

    if (!canDeleteReview(current.userId, user)) {
      throw new ForbiddenError('Kamu hanya bisa menghapus review milikmu sendiri.', 'REVIEW_FORBIDDEN');
    }

    try {
      const row = await this.reviewRepository.remove(id);
      if (!row) throw reviewNotFound();

      await this.reviewRepository.refreshStallSummary(current.stallId);
      return this.toDto(row);
    } catch (error) {
      // Review yang sudah di-like atau dilaporkan terikat foreign key.
      if (isForeignKeyViolation(error)) {
        throw new ConflictError(
          'Review ini masih memiliki like atau laporan sehingga belum bisa dihapus.',
          'REVIEW_HAS_RELATIONS',
        );
      }
      throw error;
    }
  }
}
