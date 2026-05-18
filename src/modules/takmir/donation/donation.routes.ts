import { Router } from 'express';
import { DonationController } from './donation.controller';

const router = Router({ mergeParams: true });
const controller = new DonationController();

router.post('/', controller.create);
router.get('/', controller.getList);
router.get('/summary', controller.getSummary);

export default router;
