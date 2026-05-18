import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.guard';
import { requireMasjidOwnership } from '../../middleware/masjid-ownership.guard';

// Sub-module routes
import financeRoutes from './finance/finance.routes';
import inventoryRoutes from './inventory/inventory.routes';
import donationRoutes from './donation/donation.routes';
import eventRoutes from './event/event.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import profileRoutes from './profile/profile.routes';

const router = Router();

// All takmir routes require authentication + MASJID_ADMIN role + ownership check
router.use(
  '/:masjidId',
  authenticate,
  requireRole('MASJID_ADMIN', 'SUPER_ADMIN'),
  requireMasjidOwnership
);

// Mount sub-modules under /:masjidId/
router.use('/:masjidId/finance', financeRoutes);
router.use('/:masjidId/inventory', inventoryRoutes);
router.use('/:masjidId/donation', donationRoutes);
router.use('/:masjidId/event', eventRoutes);
router.use('/:masjidId/dashboard', dashboardRoutes);
router.use('/:masjidId/profile', profileRoutes);

export default router;
