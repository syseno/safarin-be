import prisma from '../../config/database';

export class LocationService {
  /**
   * Get all countries ordered alphabetically.
   */
  async getCountries() {
    return prisma.country.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Get cities, optionally filtered by country.
   */
  async getCities(countryId?: string) {
    return prisma.city.findMany({
      where: countryId ? { countryId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get districts, optionally filtered by city.
   */
  async getDistricts(cityId?: string) {
    return prisma.district.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get sub-districts, optionally filtered by district.
   */
  async getSubDistricts(districtId?: string) {
    return prisma.subDistrict.findMany({
      where: districtId ? { districtId } : undefined,
      orderBy: { name: 'asc' },
    });
  }
}
