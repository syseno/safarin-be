import { z } from 'zod';

export const createFinanceDto = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  amount: z.number().positive('Amount must be a positive number'),
  type: z.enum(['DEBIT', 'CREDIT'], { required_error: 'Type must be DEBIT or CREDIT' }),
  description: z.string().min(1, 'Description is required for audit trail'),
  inventoryId: z.string().uuid().optional().nullable(),
  donationId: z.string().uuid().optional().nullable(),
});

export type CreateFinanceDto = z.infer<typeof createFinanceDto>;
