import { z } from 'zod';

export const createMasjidDto = z.object({
  name: z.string().min(3, 'Masjid name must be at least 3 characters'),
  addressDetail: z.string().min(5, 'Address detail must be at least 5 characters'),
  countryId: z.string().uuid('Invalid Country ID'),
  cityId: z.string().uuid('Invalid City ID'),
  districtId: z.string().uuid('Invalid District ID'),
  subDistrictId: z.string().uuid('Invalid SubDistrict ID'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  adminEmail: z.string().email('Invalid admin email address'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminPassword: z.string().min(6, 'Admin password must be at least 6 characters'),
});

export const verifyMasjidDto = z.object({
  verified: z.boolean(),
});

export type CreateMasjidDto = z.infer<typeof createMasjidDto>;
export type VerifyMasjidDto = z.infer<typeof verifyMasjidDto>;
