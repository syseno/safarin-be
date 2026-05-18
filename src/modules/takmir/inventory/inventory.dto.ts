import { z } from 'zod';

export const createInventoryDto = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  quantity: z.number().int().min(0, 'Quantity must be 0 or more').default(0),
  condition: z.enum(['GOOD', 'DAMAGED', 'LOST']).default('GOOD'),
});

export const updateQuantityDto = z.object({
  quantity: z.number().int().min(0, 'Quantity must be 0 or more'),
});

export const updateConditionDto = z.object({
  condition: z.enum(['GOOD', 'DAMAGED', 'LOST'], { required_error: 'Condition must be GOOD, DAMAGED, or LOST' }),
});

export type CreateInventoryDto = z.infer<typeof createInventoryDto>;
export type UpdateQuantityDto = z.infer<typeof updateQuantityDto>;
export type UpdateConditionDto = z.infer<typeof updateConditionDto>;
