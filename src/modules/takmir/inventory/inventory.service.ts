import { InventoryCondition } from '@prisma/client';
import prisma from '../../../config/database';
import { CreateInventoryDto, UpdateQuantityDto, UpdateConditionDto } from './inventory.dto';

export class InventoryService {
  async createItem(masjidId: string, data: CreateInventoryDto) {
    return prisma.inventory.create({
      data: {
        name: data.name,
        quantity: data.quantity,
        condition: data.condition as InventoryCondition,
        masjidId,
      },
    });
  }

  async updateQuantity(masjidId: string, itemId: string, data: UpdateQuantityDto) {
    const item = await prisma.inventory.findFirst({
      where: { id: itemId, masjidId },
    });

    if (!item) {
      throw new Error('Inventory item not found.');
    }

    return prisma.inventory.update({
      where: { id: itemId },
      data: { quantity: data.quantity },
    });
  }

  async updateCondition(masjidId: string, itemId: string, data: UpdateConditionDto) {
    const item = await prisma.inventory.findFirst({
      where: { id: itemId, masjidId },
    });

    if (!item) {
      throw new Error('Inventory item not found.');
    }

    return prisma.inventory.update({
      where: { id: itemId },
      data: { condition: data.condition as InventoryCondition },
    });
  }

  async getInventoryList(masjidId: string) {
    return prisma.inventory.findMany({
      where: { masjidId },
      include: {
        _count: { select: { finances: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInventoryDetail(masjidId: string, itemId: string) {
    const item = await prisma.inventory.findFirst({
      where: { id: itemId, masjidId },
      include: {
        finances: {
          select: { id: true, title: true, amount: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!item) {
      throw new Error('Inventory item not found.');
    }

    return item;
  }
}
