import { StallRepository, type FindAllParams } from '../repositories/stallRepository.ts';
import { MenuItemRepository } from '../repositories/menuItemRepository.ts';
import type { MenuItemDto, StallResponseDto } from '../dtos/stallDto.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { isForeignKeyViolation } from '../utils/sqlError.ts';
import { canManageStall } from './ownership.ts';
import type { AuthUser } from './tokenService.ts';
import type { CreateStallInput, UpdateStallInput } from '../schemas/stallSchema.ts';

type StallRow = NonNullable<Awaited<ReturnType<StallRepository['findById']>>>;

const stallNotFound = () => new NotFoundError('Warung tidak ditemukan.', 'STALL_NOT_FOUND');

export class StallService {
  private stallRepository: StallRepository;
  private menuItemRepository: MenuItemRepository;

  constructor(
    stallRepository: StallRepository = new StallRepository(),
    menuItemRepository: MenuItemRepository = new MenuItemRepository(),
  ) {
    this.stallRepository = stallRepository;
    this.menuItemRepository = menuItemRepository;
  }

  // Mapping row DB -> DTO API (sekaligus logika bisnis isPopular).
  private toDto(row: StallRow): StallResponseDto {
    const avgRating = Number(row.avgRating);
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      category: row.category,
      location: row.location,
      description: row.description,
      imageUrl: row.imageUrl,
      avgRating,
      reviewCount: row.reviewCount,
      isPopular: avgRating >= 4.7,
    };
  }

  async getAllStalls(params: FindAllParams) {
    const { rows, total } = await this.stallRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getMyStalls(ownerId: number): Promise<StallResponseDto[]> {
    const rows = await this.stallRepository.findByOwnerId(ownerId);
    return rows.map((row) => this.toDto(row));
  }

  getCategories(): Promise<string[]> {
    return this.stallRepository.findCategories();
  }

  async getStallById(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw stallNotFound();
    return this.toDto(row);
  }

  async getStallMenus(id: number): Promise<MenuItemDto[]> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw stallNotFound();
    return this.menuItemRepository.findByStallId(id);
  }

  /** `ownerId` datang dari sesi login, bukan dari body request. */
  async createStall(input: CreateStallInput, ownerId: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.create({ ...input, ownerId });
    if (!row) throw new NotFoundError('Warung gagal dibuat.', 'STALL_NOT_CREATED');
    return this.toDto(row);
  }

  async updateStall(id: number, input: UpdateStallInput, user: AuthUser): Promise<StallResponseDto> {
    // Otorisasi tingkat objek: role "owner" saja belum cukup.
    const current = await this.stallRepository.findById(id);
    if (!current) throw stallNotFound();

    if (!canManageStall(current.ownerId, user)) {
      throw new ForbiddenError('Kamu hanya bisa mengubah warung milikmu sendiri.', 'STALL_FORBIDDEN');
    }

    const row = await this.stallRepository.update(id, input);
    if (!row) throw stallNotFound();
    return this.toDto(row);
  }

  async deleteStall(id: number, user: AuthUser): Promise<StallResponseDto> {
    // Otorisasi tingkat objek: owner hanya boleh menghapus warungnya sendiri,
    // admin boleh menghapus warung siapa pun.
    const current = await this.stallRepository.findById(id);
    if (!current) throw stallNotFound();

    if (!canManageStall(current.ownerId, user)) {
      throw new ForbiddenError('Kamu hanya bisa menghapus warung milikmu sendiri.', 'STALL_FORBIDDEN');
    }

    try {
      const row = await this.stallRepository.remove(id);
      if (!row) throw stallNotFound();
      return this.toDto(row);
    } catch (error) {
      // Warung yang masih punya menu/review ditolak foreign key. Ubah menjadi
      // 409 yang bisa dijelaskan ke pengguna, bukan 500.
      if (isForeignKeyViolation(error)) {
        throw new ConflictError(
          'Warung masih memiliki menu atau review. Hapus data terkait terlebih dahulu.',
          'STALL_HAS_RELATIONS',
        );
      }
      throw error;
    }
  }
}
