import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { createInventoryDto, updateQuantityDto, updateConditionDto } from './inventory.dto';
import { sendSuccess, sendCreated } from '../../../utils/response';

export class InventoryController {
  private readonly service = new InventoryService();

  /**
   * Add a new inventory item to a masjid.
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createInventoryDto.parse(req.body);
      const masjidId = req.params.masjidId as string;
      const item = await this.service.createItem(masjidId, data);
      sendCreated(res, 'Inventory item created successfully.', item);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update the quantity of an inventory item.
   */
  updateQuantity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateQuantityDto.parse(req.body);
      const masjidId = req.params.masjidId as string;
      const id = req.params.id as string;
      const item = await this.service.updateQuantity(masjidId, id, data);
      sendSuccess(res, 'Inventory quantity updated.', item);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update the condition of an inventory item.
   */
  updateCondition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateConditionDto.parse(req.body);
      const masjidId = req.params.masjidId as string;
      const id = req.params.id as string;
      const item = await this.service.updateCondition(masjidId, id, data);
      sendSuccess(res, 'Inventory condition updated.', item);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get all inventory items for a masjid.
   */
  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const items = await this.service.getInventoryList(masjidId);
      sendSuccess(res, 'Inventory list retrieved.', items);
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get details of a single inventory item with finance history.
   */
  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const masjidId = req.params.masjidId as string;
      const id = req.params.id as string;
      const item = await this.service.getInventoryDetail(masjidId, id);
      sendSuccess(res, 'Inventory item retrieved.', item);
    } catch (err) {
      next(err);
    }
  };
}
