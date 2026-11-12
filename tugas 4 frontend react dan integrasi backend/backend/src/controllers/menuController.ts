import type { Request, Response } from 'express';
import { MenuService } from '../services/menuService.ts';
import { getUser } from '../middlewares/auth.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { IdParam } from '../schemas/stallSchema.ts';
import type { CreateMenuInput, UpdateMenuInput } from '../schemas/menuSchema.ts';

export class MenuController {
  private menuService: MenuService;

  constructor(menuService: MenuService = new MenuService()) {
    this.menuService = menuService;
  }

  /** POST /stalls/:id/menus — :id adalah id WARUNG. */
  createMenu = async (req: Request, res: Response): Promise<void> => {
    const { id: stallId } = getValidated<IdParam>(res, 'params');
    const body = getValidated<CreateMenuInput>(res, 'body');
    const data = await this.menuService.createMenu(stallId, body, getUser(req));
    res.status(201).json({ status: 'success', message: 'Menu berhasil ditambahkan.', data });
  };

  /** PUT /menus/:id — :id adalah id MENU. */
  updateMenu = async (req: Request, res: Response): Promise<void> => {
    const { id } = getValidated<IdParam>(res, 'params');
    const body = getValidated<UpdateMenuInput>(res, 'body');
    const data = await this.menuService.updateMenu(id, body, getUser(req));
    res.status(200).json({ status: 'success', message: 'Menu berhasil diperbarui.', data });
  };

  deleteMenu = async (req: Request, res: Response): Promise<void> => {
    const { id } = getValidated<IdParam>(res, 'params');
    await this.menuService.deleteMenu(id, getUser(req));
    // 204 No Content: sukses tanpa body.
    res.status(204).end();
  };
}
