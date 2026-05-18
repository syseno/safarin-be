import { Router } from 'express';
import { EventController } from './event.controller';

const router = Router({ mergeParams: true });
const controller = new EventController();

router.post('/', controller.create);
router.get('/', controller.getList);
router.get('/:id', controller.getDetail);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
