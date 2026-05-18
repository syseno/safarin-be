import { Router } from 'express';
import { FinanceController } from './finance.controller';

const router = Router({ mergeParams: true });
const controller = new FinanceController();

router.post('/', controller.create);
router.get('/', controller.getList);
router.get('/:id', controller.getDetail);

export default router;
