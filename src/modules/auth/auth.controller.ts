import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { registerDto, loginDto } from './auth.dto';
import { sendSuccess, sendCreated, sendError } from '../../utils/response';

export class AuthController {
  private readonly service = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = registerDto.parse(req.body);
      const result = await this.service.register(data);
      sendCreated(res, 'Registration successful.', result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = loginDto.parse(req.body);
      const result = await this.service.login(data);
      sendSuccess(res, 'Login successful.', result);
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated.', 401);
        return;
      }
      const user = await this.service.getProfile(req.user.id);
      sendSuccess(res, 'Profile retrieved.', user);
    } catch (err) {
      next(err);
    }
  };
}
