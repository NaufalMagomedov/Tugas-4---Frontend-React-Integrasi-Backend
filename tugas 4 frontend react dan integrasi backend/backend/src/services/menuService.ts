import { MenuItemRepository } from '../repositories/menuItemRepository.ts';
import { StallRepository } from '../repositories/stallRepository.ts';
import type { MenuItemDto } from '../dtos/stallDto.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { ForbiddenError } from '../errors/ForbiddenError.ts';
import { NotFoundError } from '../errors/NotFoundError.ts';
import type { CreateMenuInput, UpdateMenuInput } from '../schemas/menuSchema.ts';
import { canManageStall } from './ownership.ts';
import type { AuthUser } from './tokenService.ts';

const stallNotFound = () => new NotFoundError('Warung tidak ditemukan.', 'STALL_NOT_FOUND');
const menuNotFound = () => new NotFoundError('Menu tidak ditemukan.', 'MENU_NOT_FOUND');
const nameTaken = () =>
  new ConflictError('Nama menu sudah dipakai di warung ini.', 'MENU_NAME_TAKEN', [
    { field: 'name', message: 'Warung ini sudah punya menu dengan nama yang sama.' },
  ]);

export class MenuService {
  private menuRepository: MenuItemRepository;
  private stallRepository: StallRepository;

  constructor(
    menuRepository: MenuItemRepository = new MenuItemRepository(),
    stallRepository: StallRepository = new StallRepository(),
  ) {
    this.menuRepository = menuRepository;
    this.stallRepository = stallRepository;
  }

  async createMenu(stallId: number, input: CreateMenuInput, user: AuthUser): Promise<MenuItemDto> {
    const stall = await this.stallRepository.findById(stallId);
    if (!stall) throw stallNotFound();

    if (!canManageStall(stall.ownerId, user)) {
      throw new ForbiddenError('Kamu hanya bisa menambah menu pada warung milikmu sendiri.', 'STALL_FORBIDDEN');
    }

    if (await this.menuRepository.findByStallAndName(stallId, input.name)) throw nameTaken();

    const row = await this.menuRepository.create({ stallId, ...input });
    if (!row) throw new NotFoundError('Menu gagal dibuat.', 'MENU_NOT_CREATED');
    return row;
  }

  async updateMenu(id: number, input: UpdateMenuInput, user: AuthUser): Promise<MenuItemDto> {
    const current = await this.menuRepository.findById(id);
    if (!current) throw menuNotFound();

    const stall = await this.stallRepository.findById(current.stallId);
    if (!stall) throw stallNotFound();

    if (!canManageStall(stall.ownerId, user)) {
      throw new ForbiddenError('Kamu hanya bisa mengubah menu pada warung milikmu sendiri.', 'MENU_FORBIDDEN');
    }

    if (input.name !== undefined && (await this.menuRepository.findByStallAndName(current.stallId, input.name, id))) {
      throw nameTaken();
    }

    const row = await this.menuRepository.update(id, input);
    if (!row) throw menuNotFound();
    return row;
  }

  async deleteMenu(id: number, user: AuthUser): Promise<MenuItemDto> {
    const current = await this.menuRepository.findById(id);
    if (!current) throw menuNotFound();

    const stall = await this.stallRepository.findById(current.stallId);
    if (!stall) throw stallNotFound();

    if (!canManageStall(stall.ownerId, user)) {
      throw new ForbiddenError('Kamu hanya bisa menghapus menu pada warung milikmu sendiri.', 'MENU_FORBIDDEN');
    }

    const row = await this.menuRepository.remove(id);
    if (!row) throw menuNotFound();
    return row;
  }
}
