import { Request, Response, NextFunction } from 'express';
import { DonationService } from './donation.service';
import { createDonationDto } from './donation.dto';
import { sendSuccess, sendCreated } from '../../../utils/response';

export class DonationController {
  private readonly service = new DonationService();

  /**
   * Record a new donation and auto-create linked finance entry.
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createDonationDto.parse(req.body);
      const masjidId = req.params.masjidId as string;
      const result = await this.service.createDonation(masjidId, data);
      sendCreated(res, 'Donation recorded successfully with linked finance entry.', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get all donations for a masjid with linked finance records.
   */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const donations = await this.service.getDonationList(masjidId);
      sendSuccess(res, 'Donation list retrieved.', donations);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get donation summary grouped by type.
   */
  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const summary = await this.service.getSummaryByType(masjidId);
      sendSuccess(res, 'Donation summary retrieved.', summary);
    } catch (err) {
      next(err);
    }
  };
}
