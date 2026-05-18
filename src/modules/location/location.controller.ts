import { Request, Response, NextFunction } from 'express';
import { LocationService } from './location.service';
import { sendSuccess } from '../../utils/response';

export class LocationController {
  private readonly service = new LocationService();

  /**
   * Get all available countries.
   */
  getCountries = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getCountries();
      sendSuccess(res, 'Countries fetched.', data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get cities filtered by country.
   */
  getCities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const countryId = req.query.countryId as string;
      const data = await this.service.getCities(countryId);
      sendSuccess(res, 'Cities fetched.', data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get districts filtered by city.
   */
  getDistricts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cityId = req.query.cityId as string;
      const data = await this.service.getDistricts(cityId);
      sendSuccess(res, 'Districts fetched.', data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get sub-districts filtered by district.
   */
  getSubDistricts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const districtId = req.query.districtId as string;
      const data = await this.service.getSubDistricts(districtId);
      sendSuccess(res, 'Sub-districts fetched.', data);
    } catch (err) {
      next(err);
    }
  };
}
