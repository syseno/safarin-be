import { Request, Response, NextFunction } from 'express';
import { PublicService } from './public.service';
import { sendSuccess } from '../../utils/response';

export class PublicController {
  private readonly service = new PublicService();

  /**
   * Get nearest verified masjids from user's location with computed distance.
   */
  getNearestMasjid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const cityId = req.query.cityId as string || undefined;

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude query parameters are required and must be valid numbers.',
        });
        return;
      }

      const result = await this.service.getNearestMasjid(latitude, longitude, radius, limit, cityId);
      sendSuccess(res, 'Nearest masjids retrieved successfully.', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Search verified masjid by name or address.
   */
  searchMasjid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.query.q as string) || '';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.service.searchMasjid(query, page, limit);
      sendSuccess(res, 'Masjid search results.', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get public detail of a verified masjid.
   */
  getMasjidDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const masjid = await this.service.getMasjidDetail(masjidId);
      sendSuccess(res, 'Masjid detail retrieved.', masjid);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get public finance transparency data for a masjid.
   */
  getMasjidFinance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.service.getMasjidFinance(masjidId, page, limit);
      sendSuccess(res, 'Masjid finance data retrieved.', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get upcoming public events for a masjid.
   */
  getMasjidEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const result = await this.service.getMasjidEvents(masjidId);
      sendSuccess(res, 'Masjid events retrieved.', result);
    } catch (err) {
      next(err);
    }
  };
}
