import { z } from 'zod';

export const updateProfileDto = z.object({
  name: z.string().min(3, 'Masjid name must be at least 3 characters').optional(),
  addressDetail: z.string().min(5, 'Address detail must be at least 5 characters').optional(),
  countryId: z.string().uuid('Invalid Country ID').optional(),
  cityId: z.string().uuid('Invalid City ID').optional(),
  districtId: z.string().uuid('Invalid District ID').optional(),
  subDistrictId: z.string().uuid('Invalid SubDistrict ID').optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileDto>;
