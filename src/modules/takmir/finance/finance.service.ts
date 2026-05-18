import { FinanceType } from '@prisma/client';
import prisma from '../../../config/database';
import { CreateFinanceDto } from './finance.dto';

export class FinanceService {
  /**
   * Create a finance record with transaction-safe relations.
   *
   * Rules:
   * - CREDIT + inventoryId → inventory.quantity is incremented
   * - DEBIT + donationId → donation.amount must match finance.amount
   */
  async createFinance(masjidId: string, data: CreateFinanceDto) {
    // Validate relation constraints
    if (data.type === 'CREDIT' && data.donationId) {
      throw new Error('CREDIT (expense) cannot be linked to a donation. Donations are income sources.');
    }

    if (data.type === 'DEBIT' && data.inventoryId) {
      throw new Error('DEBIT (income) cannot be linked to an inventory purchase. Inventory is an expense target.');
    }

    return prisma.$transaction(async (tx) => {
      // If linking to an inventory item (purchase expense)
      if (data.inventoryId && data.type === 'CREDIT') {
        const inventory = await tx.inventory.findFirst({
          where: { id: data.inventoryId, masjidId },
        });

        if (!inventory) {
          throw new Error('Inventory item not found in this masjid.');
        }

        // Increment inventory quantity
        await tx.inventory.update({
          where: { id: data.inventoryId },
          data: { quantity: { increment: 1 } },
        });
      }

      // If linking to a donation (income from donation)
      if (data.donationId && data.type === 'DEBIT') {
        const donation = await tx.donation.findFirst({
          where: { id: data.donationId, masjidId },
        });

        if (!donation) {
          throw new Error('Donation not found in this masjid.');
        }

        if (donation.amount !== data.amount) {
          throw new Error(
            `Finance amount (${data.amount}) must match donation amount (${donation.amount}).`
          );
        }

        // Ensure donation is not already linked to another finance
        const existingLink = await tx.finance.findUnique({
          where: { donationId: data.donationId },
        });

        if (existingLink) {
          throw new Error('This donation is already linked to a finance record.');
        }
      }

      // Create the finance record
      const finance = await tx.finance.create({
        data: {
          title: data.title,
          amount: data.amount,
          type: data.type as FinanceType,
          description: data.description,
          masjidId,
          inventoryId: data.inventoryId || null,
          donationId: data.donationId || null,
        },
        include: {
          inventory: true,
          donation: true,
        },
      });

      return finance;
    });
  }

  /**
   * Get paginated list of finance records for a masjid.
   */
  async getFinanceList(masjidId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.finance.findMany({
        where: { masjidId },
        include: {
          inventory: { select: { id: true, name: true, condition: true } },
          donation: { select: { id: true, type: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.finance.count({ where: { masjidId } }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single finance record with full relations.
   */
  async getFinanceDetail(masjidId: string, financeId: string) {
    const finance = await prisma.finance.findFirst({
      where: { id: financeId, masjidId },
      include: {
        inventory: true,
        donation: true,
      },
    });

    if (!finance) {
      throw new Error('Finance record not found.');
    }

    return finance;
  }
}
