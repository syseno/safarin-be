import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { AdminService } from './admin.service';
import { createMasjidDto, verifyMasjidDto } from './admin.dto';
import { sendSuccess, sendCreated } from '../../utils/response';

export class AdminController {
  private readonly service = new AdminService();

  /**
   * Create a new masjid with an associated admin account.
   */
  createMasjid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createMasjidDto.parse(req.body);
      const skDkmPath = req.file ? req.file.path : undefined;
      const masjid = await this.service.createMasjid(data, skDkmPath);
      sendCreated(res, 'Masjid created successfully with admin assigned.', masjid);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Verify or reject a masjid registration.
   */
  verifyMasjid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const data = verifyMasjidDto.parse(req.body);
      const masjid = await this.service.verifyMasjid(id, data.verified);
      sendSuccess(res, `Masjid ${data.verified ? 'verified' : 'rejected'} successfully.`, masjid);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get list of masjid awaiting verification.
   */
  getUnverifiedMasjid = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const masjids = await this.service.getUnverifiedMasjid();
      sendSuccess(res, 'Unverified masjid retrieved.', masjids);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get all registered masjid.
   */
  getAllMasjid = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const masjids = await this.service.getAllMasjid();
      sendSuccess(res, 'All masjid retrieved.', masjids);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get all system users.
   */
  getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.service.getAllUsers();
      sendSuccess(res, 'All users retrieved.', users);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Download SK DKM document for a masjid.
   */
  getSkDkm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { filePath } = await this.service.getSkDkm(id);
      const absolutePath = path.resolve(filePath);
      res.download(absolutePath);
    } catch (err) {
      next(err);
    }
  };
}
