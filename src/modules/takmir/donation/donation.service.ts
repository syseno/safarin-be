import { DonationType, FinanceType } from '@prisma/client';
import prisma from '../../../config/database';
import { CreateDonationDto } from './donation.dto';

export class DonationService {
  /**
   * Create a donation and automatically create a linked DEBIT finance record.
   * Uses Prisma transaction for atomicity.
   */
  async createDonation(masjidId: string, data: CreateDonationDto) {
    return prisma.$transaction(async (tx) => {
      // Create the donation record
      const donation = await tx.donation.create({
        data: {
          type: data.type as DonationType,
          amount: data.amount,
          description: data.description,
          masjidId,
        },
      });

      // Auto-create linked DEBIT finance record
      const finance = await tx.finance.create({
        data: {
          title: `Donation: ${data.type} - ${data.description}`,
          amount: data.amount,
          type: FinanceType.DEBIT,
          description: `Income from ${data.type.toLowerCase()} donation: ${data.description}`,
          masjidId,
          donationId: donation.id,
        },
      });

      return { donation, finance };
    });
  }

  /**
   * Get all donations for a masjid, with linked finance records.
   */
  async getDonationList(masjidId: string) {
    return prisma.donation.findMany({
      where: { masjidId },
      include: {
        finance: {
          select: { id: true, title: true, amount: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get donation summary grouped by type with totals.
   */
  async getSummaryByType(masjidId: string) {
    const summary = await prisma.donation.groupBy({
      by: ['type'],
      where: { masjidId },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Ensure all types are represented even if zero
    const allTypes: DonationType[] = ['SADAQAH', 'INFAQ', 'ZAKAT'];
    const result = allTypes.map((type) => {
      const found = summary.find((s) => s.type === type);
      return {
        type,
        totalAmount: found?._sum.amount || 0,
        count: found?._count.id || 0,
      };
    });

    const grandTotal = result.reduce((sum, item) => sum + item.totalAmount, 0);

    return { summary: result, grandTotal };
  }
}
