import { Request, Response, NextFunction } from 'express';
import { PublicService } from './public.service';
import { sendSuccess } from '../../utils/response';

export class PublicController {
  private readonly service = new PublicService();

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
