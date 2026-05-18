import { z } from 'zod';

export const createDonationDto = z.object({
  type: z.enum(['SADAQAH', 'INFAQ', 'ZAKAT'], { required_error: 'Donation type is required' }),
  amount: z.number().positive('Amount must be a positive number'),
  description: z.string().min(1, 'Description is required'),
});

export type CreateDonationDto = z.infer<typeof createDonationDto>;
