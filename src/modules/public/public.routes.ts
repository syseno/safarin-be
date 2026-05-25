import { Router } from 'express';
import { PublicController } from './public.controller';

const router = Router();
const controller = new PublicController();

// No auth required — public endpoints
router.get('/masjid', controller.searchMasjid);
router.get('/masjid/nearest', controller.getNearestMasjid);
router.get('/masjid/:masjidId', controller.getMasjidDetail);
router.get('/masjid/:masjidId/finance', controller.getMasjidFinance);
router.get('/masjid/:masjidId/events', controller.getMasjidEvents);

export default router;
