import { Router } from 'express';
import { InventoryController } from './inventory.controller';

const router = Router({ mergeParams: true });
const controller = new InventoryController();

router.post('/', controller.create);
router.get('/', controller.getList);
router.get('/:id', controller.getDetail);
router.patch('/:id/quantity', controller.updateQuantity);
router.patch('/:id/condition', controller.updateCondition);

export default router;
