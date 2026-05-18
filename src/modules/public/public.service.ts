import prisma from '../../config/database';

export class PublicService {
  async searchMasjid(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      verified: true,
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { addressDetail: { contains: query, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [masjids, total] = await Promise.all([
      prisma.masjid.findMany({
        where,
        select: {
          id: true, name: true, addressDetail: true, phone: true,
          description: true, imageUrl: true, verified: true,
          country: true, city: true, district: true, subDistrict: true,
          latitude: true, longitude: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.masjid.count({ where }),
    ]);

    return {
      masjids,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMasjidFinance(masjidId: string, page = 1, limit = 20) {
    const masjid = await prisma.masjid.findFirst({
      where: { id: masjidId, verified: true },
      select: { id: true, name: true },
    });
    if (!masjid) throw new Error('Masjid not found or not verified.');

    const skip = (page - 1) * limit;
    const [records, total, debitAgg, creditAgg] = await Promise.all([
      prisma.finance.findMany({
        where: { masjidId },
        select: { id: true, title: true, amount: true, type: true, description: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.finance.count({ where: { masjidId } }),
      prisma.finance.aggregate({ where: { masjidId, type: 'DEBIT' }, _sum: { amount: true } }),
      prisma.finance.aggregate({ where: { masjidId, type: 'CREDIT' }, _sum: { amount: true } }),
    ]);

    const totalIncome = debitAgg._sum.amount || 0;
    const totalExpense = creditAgg._sum.amount || 0;

    return {
      masjid,
      summary: { totalIncome, totalExpense, balance: totalIncome - totalExpense },
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMasjidEvents(masjidId: string) {
    const masjid = await prisma.masjid.findFirst({
      where: { id: masjidId, verified: true },
      select: { id: true, name: true },
    });
    if (!masjid) throw new Error('Masjid not found or not verified.');

    const events = await prisma.event.findMany({
      where: { masjidId, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 20,
    });

    return { masjid, events };
  }

  async getMasjidDetail(masjidId: string) {
    const masjid = await prisma.masjid.findFirst({
      where: { id: masjidId, verified: true },
      select: {
        id: true, name: true, addressDetail: true, phone: true,
        description: true, imageUrl: true, verified: true, createdAt: true,
        country: true, city: true, district: true, subDistrict: true,
        latitude: true, longitude: true,
      },
    });
    if (!masjid) throw new Error('Masjid not found or not verified.');
    return masjid;
  }
}
