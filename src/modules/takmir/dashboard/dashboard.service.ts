import prisma from '../../../config/database';

export class DashboardService {
  /**
   * Get comprehensive dashboard data for a masjid.
   */
  async getDashboard(masjidId: string) {
    const [financeSummary, donationSummary, inventorySummary, recentFinance, upcomingEvents] =
      await Promise.all([
        this.getFinanceSummary(masjidId),
        this.getDonationSummary(masjidId),
        this.getInventorySummary(masjidId),
        this.getRecentFinance(masjidId),
        this.getUpcomingEvents(masjidId),
      ]);

    return {
      finance: financeSummary,
      donations: donationSummary,
      inventory: inventorySummary,
      recentFinance,
      upcomingEvents,
    };
  }

  /**
   * Finance summary: total DEBIT (income), total CREDIT (expense), balance.
   */
  private async getFinanceSummary(masjidId: string) {
    const [debitResult, creditResult] = await Promise.all([
      prisma.finance.aggregate({
        where: { masjidId, type: 'DEBIT' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.finance.aggregate({
        where: { masjidId, type: 'CREDIT' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalDebit = debitResult._sum.amount || 0;
    const totalCredit = creditResult._sum.amount || 0;

    return {
      totalIncome: totalDebit,
      totalExpense: totalCredit,
      balance: totalDebit - totalCredit,
      incomeCount: debitResult._count,
      expenseCount: creditResult._count,
    };
  }

  /**
   * Donation summary grouped by type with totals.
   */
  private async getDonationSummary(masjidId: string) {
    const grouped = await prisma.donation.groupBy({
      by: ['type'],
      where: { masjidId },
      _sum: { amount: true },
      _count: true,
    });

    const totalAmount = grouped.reduce((sum, g) => sum + (g._sum.amount || 0), 0);

    return {
      byType: grouped.map((g) => ({
        type: g.type,
        total: g._sum.amount || 0,
        count: g._count,
      })),
      totalAmount,
    };
  }

  /**
   * Inventory summary: total items, by condition.
   */
  private async getInventorySummary(masjidId: string) {
    const [total, byCondition] = await Promise.all([
      prisma.inventory.count({ where: { masjidId } }),
      prisma.inventory.groupBy({
        by: ['condition'],
        where: { masjidId },
        _count: true,
        _sum: { quantity: true },
      }),
    ]);

    return {
      totalItems: total,
      byCondition: byCondition.map((g) => ({
        condition: g.condition,
        count: g._count,
        totalQuantity: g._sum.quantity || 0,
      })),
    };
  }

  /**
   * Last 5 finance records.
   */
  private async getRecentFinance(masjidId: string) {
    return prisma.finance.findMany({
      where: { masjidId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        inventory: { select: { id: true, name: true } },
        donation: { select: { id: true, type: true } },
      },
    });
  }

  /**
   * Next 5 upcoming events.
   */
  private async getUpcomingEvents(masjidId: string) {
    return prisma.event.findMany({
      where: {
        masjidId,
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      take: 5,
    });
  }
}
