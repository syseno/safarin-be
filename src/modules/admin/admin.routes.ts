import { Router } from 'express';
import { Role } from '@prisma/client';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.guard';
import { uploadPrivate } from '../../middleware/upload.middleware';

const router = Router();
const controller = new AdminController();

// All admin routes require SUPER_ADMIN role
router.use(authenticate, requireRole(Role.SUPER_ADMIN));

router.post('/masjid', uploadPrivate.single('skDkm'), controller.createMasjid);
router.patch('/masjid/:id/verify', controller.verifyMasjid);
router.get('/masjid/unverified', controller.getUnverifiedMasjid);
router.get('/masjid', controller.getAllMasjid);
router.get('/masjid/:id/sk-dkm', controller.getSkDkm);
router.get('/users', controller.getAllUsers);

export default router;
