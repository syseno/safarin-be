import { Request, Response, NextFunction } from 'express';
import { EventService } from './event.service';
import { createEventDto, updateEventDto } from './event.dto';
import { sendSuccess, sendCreated } from '../../../utils/response';

export class EventController {
  private readonly service = new EventService();

  /**
   * Create a new masjid event.
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createEventDto.parse(req.body);
      const masjidId = req.params.masjidId as string;
      const event = await this.service.createEvent(masjidId, data);
      sendCreated(res, 'Event created successfully.', event);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update an existing event with partial data.
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateEventDto.parse(req.body);
      const masjidId = req.params.masjidId as string;
      const id = req.params.id as string;
      const event = await this.service.updateEvent(masjidId, id, data);
      sendSuccess(res, 'Event updated successfully.', event);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Delete a masjid event.
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const id = req.params.id as string;
      const deleteType = (req.query.deleteType as 'SINGLE' | 'ALL') || 'SINGLE';
      await this.service.deleteEvent(masjidId, id, deleteType);
      sendSuccess(res, 'Event deleted successfully.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get paginated list of events for a masjid.
   */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await this.service.getEventList(masjidId, page, limit);
      sendSuccess(res, 'Events retrieved.', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get details of a single event.
   */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const id = req.params.id as string;
      const event = await this.service.getEventDetail(masjidId, id);
      sendSuccess(res, 'Event retrieved.', event);
    } catch (err) {
      next(err);
    }
  };
}
