import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../../utils/response';

export class DashboardController {
  private readonly service = new DashboardService();

  /**
   * Get comprehensive dashboard data for a masjid.
   */
  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const data = await this.service.getDashboard(masjidId);
      sendSuccess(res, 'Dashboard data retrieved.', data);
    } catch (err) {
      next(err);
    }
  };
}
