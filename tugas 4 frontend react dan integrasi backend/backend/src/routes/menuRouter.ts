import { Router } from 'express';
import { MenuController } from '../controllers/menuController.ts';
import { validate } from '../middlewares/validate.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';
import { idParamSchema } from '../schemas/stallSchema.ts';
import { updateMenuSchema } from '../schemas/menuSchema.ts';

const menuRouter = Router();
const menuController = new MenuController();

// Mengubah/menghapus menu: role owner/admin + kepemilikan (dicek di MenuService).
menuRouter.put(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate(idParamSchema, 'params'),
  validate(updateMenuSchema, 'body'),
  menuController.updateMenu,
);
menuRouter.delete('/:id', authenticate, authorize('owner', 'admin'), validate(idParamSchema, 'params'), menuController.deleteMenu);

export { menuRouter };
