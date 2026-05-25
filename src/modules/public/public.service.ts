import { Prisma } from '@prisma/client';
import prisma from '../../config/database';

export class PublicService {
  async getNearestMasjid(lat: number, lng: number, radius?: number, limit?: number, cityId?: string) {
    let queryConditions = Prisma.sql`m.verified = true AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL`;
    
    if (cityId) {
      queryConditions = Prisma.sql`${queryConditions} AND m."cityId" = ${cityId}`;
    }

    const rawQuery = Prisma.sql`
      SELECT * FROM (
        SELECT
          m.id,
          m.name,
          m."addressDetail",
          m.latitude,
          m.longitude,
          m.verified,
          m."imageUrl",
          m.phone,
          m.description,
          (
            6371 * acos(
              least(1.0, greatest(-1.0,
                cos(radians(${lat})) * cos(radians(m.latitude)) * cos(radians(m.longitude) - radians(${lng})) +
                sin(radians(${lat})) * sin(radians(m.latitude))
              ))
            )
          ) AS distance,
          c.id AS "city_id",
          c.name AS "city_name",
          co.id AS "country_id",
          co.name AS "country_name",
          d.id AS "district_id",
          d.name AS "district_name",
          sd.id AS "subdistrict_id",
          sd.name AS "subdistrict_name"
        FROM "Masjid" m
        LEFT JOIN "City" c ON m."cityId" = c.id
        LEFT JOIN "Country" co ON m."countryId" = co.id
        LEFT JOIN "District" d ON m."districtId" = d.id
        LEFT JOIN "SubDistrict" sd ON m."subDistrictId" = sd.id
        WHERE ${queryConditions}
      ) AS sub
      ${radius ? Prisma.sql`WHERE distance <= ${radius}` : Prisma.empty}
      ORDER BY distance ASC
      ${limit ? Prisma.sql`LIMIT ${limit}` : Prisma.empty}
    `;

    const rows: any[] = await prisma.$queryRaw(rawQuery);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      addressDetail: row.addressDetail,
      latitude: row.latitude,
      longitude: row.longitude,
      verified: row.verified,
      imageUrl: row.imageUrl,
      phone: row.phone,
      description: row.description,
      distance: row.distance,
      city: row.city_id ? { id: row.city_id, name: row.city_name } : null,
      country: row.country_id ? { id: row.country_id, name: row.country_name } : null,
      district: row.district_id ? { id: row.district_id, name: row.district_name } : null,
      subDistrict: row.subdistrict_id ? { id: row.subdistrict_id, name: row.subdistrict_name } : null,
    }));
  }

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
