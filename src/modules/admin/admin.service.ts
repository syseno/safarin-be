import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import prisma from '../../config/database';
import { CreateMasjidDto } from './admin.dto';

export class AdminService {
  /**
   * Create a new masjid + create a MASJID_ADMIN user + assign as admin.
   * Optionally accepts SK DKM file path.
   */
  async createMasjid(data: CreateMasjidDto, skDkmPath?: string) {
    // Check if admin email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail },
    });

    if (existingUser) {
      throw new Error('Admin email is already registered.');
    }

    const hashedPassword = await bcrypt.hash(data.adminPassword, 12);

    // Use transaction to create user + masjid atomically
    const result = await prisma.$transaction(async (tx) => {
      const admin = await tx.user.create({
        data: {
          name: data.adminName,
          email: data.adminEmail,
          password: hashedPassword,
          role: Role.MASJID_ADMIN,
        },
      });

      const masjid = await tx.masjid.create({
        data: {
          name: data.name,
          addressDetail: data.addressDetail,
          countryId: data.countryId,
          cityId: data.cityId,
          districtId: data.districtId,
          subDistrictId: data.subDistrictId,
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone,
          description: data.description,
          adminId: admin.id,
          skDkmUrl: skDkmPath,
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return masjid;
    });

    return result;
  }

  /**
   * Verify or reject a masjid.
   */
  async verifyMasjid(masjidId: string, verified: boolean) {
    const masjid = await prisma.masjid.findUnique({
      where: { id: masjidId },
    });

    if (!masjid) {
      throw new Error('Masjid not found.');
    }

    const updated = await prisma.masjid.update({
      where: { id: masjidId },
      data: { verified },
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return updated;
  }

  /**
   * Get list of unverified masjid.
   */
  async getUnverifiedMasjid() {
    return prisma.masjid.findMany({
      where: { verified: false },
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
        country: true,
        city: true,
        district: true,
        subDistrict: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all masjid.
   */
  async getAllMasjid() {
    return prisma.masjid.findMany({
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
        country: true,
        city: true,
        district: true,
        subDistrict: true,
        _count: {
          select: {
            finances: true,
            events: true,
            inventories: true,
            donations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all users.
   */
  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        masjid: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get SK DKM file path for secure download.
   */
  async getSkDkm(masjidId: string) {
    const masjid = await prisma.masjid.findUnique({
      where: { id: masjidId },
      select: { skDkmUrl: true, name: true },
    });

    if (!masjid) {
      throw new Error('Masjid not found.');
    }

    if (!masjid.skDkmUrl) {
      throw new Error('SK DKM document not found for this masjid.');
    }

    return { filePath: masjid.skDkmUrl, masjidName: masjid.name };
  }
}
