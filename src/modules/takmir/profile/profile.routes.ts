import { Router } from 'express';
import { ProfileController } from './profile.controller';

const router = Router({ mergeParams: true });
const controller = new ProfileController();

router.get('/', controller.getProfile);
router.put('/', controller.updateProfile);

export default router;
