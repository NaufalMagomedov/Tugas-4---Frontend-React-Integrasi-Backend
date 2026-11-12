import { Router } from 'express';
import { AdminController } from '../controllers/adminController.ts';
import { authenticate } from '../middlewares/auth.ts';
import { authorize } from '../middlewares/authorize.ts';

const adminRouter = Router();
const adminController = new AdminController();

// authenticate (401) lebih dulu daripada authorize (403): tanpa sesi, server
// bahkan belum tahu rolenya siapa.
adminRouter.get('/reports', authenticate, authorize('admin'), adminController.getReports);

export { adminRouter };
