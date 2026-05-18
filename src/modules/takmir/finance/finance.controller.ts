import { Request, Response, NextFunction } from 'express';
import { FinanceService } from './finance.service';
import { createFinanceDto } from './finance.dto';
import { sendSuccess, sendCreated } from '../../../utils/response';

export class FinanceController {
  private readonly service = new FinanceService();

  /**
   * Create a new finance record (debit/credit).
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createFinanceDto.parse(req.body);
      const masjidId = req.params.masjidId as string;
      const finance = await this.service.createFinance(masjidId, data);
      sendCreated(res, 'Finance record created successfully.', finance);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get paginated finance records for a masjid.
   */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.service.getFinanceList(masjidId, page, limit);
      sendSuccess(res, 'Finance records retrieved.', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get a single finance record with full relations.
   */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const id = req.params.id as string;
      const finance = await this.service.getFinanceDetail(masjidId, id);
      sendSuccess(res, 'Finance record retrieved.', finance);
    } catch (err) {
      next(err);
    }
  };
}
