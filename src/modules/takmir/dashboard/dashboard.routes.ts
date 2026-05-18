import { Router } from 'express';
import { DashboardController } from './dashboard.controller';

const router = Router({ mergeParams: true });
const controller = new DashboardController();

router.get('/', controller.getDashboard);

export default router;
