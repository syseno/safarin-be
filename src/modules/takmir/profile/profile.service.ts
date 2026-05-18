import prisma from '../../../config/database';
import type { UpdateProfileDto } from './profile.dto';

/**
 * Strip undefined values from an object, leaving only defined fields.
 * Prisma ignores undefined fields, but this makes intent explicit.
 */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export class ProfileService {
  /**
   * Get full masjid profile including admin details.
   */
  async getMasjidProfile(masjidId: string) {
    const masjid = await prisma.masjid.findUnique({
      where: { id: masjidId },
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!masjid) {
      throw new Error('Masjid not found.');
    }

    return masjid;
  }

  /**
   * Partially update masjid profile with validated data.
   * Only defined fields in the DTO are applied to the database.
   */
  async updateMasjidProfile(masjidId: string, data: UpdateProfileDto) {
    const masjid = await prisma.masjid.findUnique({
      where: { id: masjidId },
    });

    if (!masjid) {
      throw new Error('Masjid not found.');
    }

    return prisma.masjid.update({
      where: { id: masjidId },
      data: stripUndefined(data),
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
