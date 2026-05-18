import { Router } from 'express';
import { LocationController } from './location.controller';

const router = Router();
const controller = new LocationController();

router.get('/countries', controller.getCountries);
router.get('/cities', controller.getCities);
router.get('/districts', controller.getDistricts);
router.get('/sub-districts', controller.getSubDistricts);

export const locationRouter = router;
