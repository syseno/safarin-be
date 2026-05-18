import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { updateProfileDto } from './profile.dto';
import { sendSuccess } from '../../../utils/response';

export class ProfileController {
  private readonly service = new ProfileService();

  /**
   * Get full masjid profile with admin details.
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const masjid = await this.service.getMasjidProfile(masjidId);
      sendSuccess(res, 'Masjid profile retrieved.', masjid);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update masjid profile with validated partial data.
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const data = updateProfileDto.parse(req.body);
      const masjid = await this.service.updateMasjidProfile(masjidId, data);
      sendSuccess(res, 'Masjid profile updated successfully.', masjid);
    } catch (err) {
      next(err);
    }
  };
}
