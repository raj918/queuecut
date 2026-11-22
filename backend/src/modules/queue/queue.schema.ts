import { z } from 'zod';

export const WalkInSchema = z.object({
  body: z.object({
    salonId: z.string().uuid(),
    customerName: z.string().min(2, 'Customer name is required'),
    customerPhone: z.string().regex(/^[6-9]\d{9}$/).optional().nullable(),
    serviceIds: z.array(z.string().uuid()).min(1, 'Select at least one service'),
    staffId: z.string().uuid().optional().nullable(),
    notes: z.string().optional(),
  }),
});

export const QueueActionSchema = z.object({
  params: z.object({
    id: z.string().uuid(), // bookingId
  }),
  body: z.object({
    staffId: z.string().uuid().optional(),
    reason: z.string().optional(),
  }).optional(),
});

export const PauseQueueSchema = z.object({
  body: z.object({
    salonId: z.string().uuid(),
    reason: z.string().min(2, 'Please provide reason for pause').default('Temporary rush / staff break'),
  }),
});

export const ResumeQueueSchema = z.object({
  body: z.object({
    salonId: z.string().uuid(),
  }),
});
