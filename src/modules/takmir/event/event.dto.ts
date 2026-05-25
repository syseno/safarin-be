import { z } from 'zod';

export const createEventDto = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format. Use ISO 8601 (e.g. 2025-06-15)',
  }),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
  location: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  recurrenceType: z.preprocess(
    (val) => val === null ? 'NONE' : val,
    z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).optional().default('NONE')
  ),
  recurrenceInterval: z.preprocess(
    (val) => val === null ? 1 : val,
    z.number().int().min(1).optional().default(1)
  ),
  recurrenceEnd: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid end date format',
  }).optional().nullable(),
  recurrenceDays: z.string().optional().nullable(),
});

export const updateEventDto = createEventDto.partial().extend({
  updateType: z.enum(['SINGLE', 'ALL']).optional(),
});

export type CreateEventDto = z.infer<typeof createEventDto>;
export type UpdateEventDto = z.infer<typeof updateEventDto>;

