import { z } from 'zod';

export const CreateBookingSchema = z.object({
  body: z.object({
    salonId: z.string().uuid('Valid salon ID required'),
    serviceIds: z.array(z.string().uuid()).min(1, 'Please select at least one service'),
    staffId: z.string().uuid().optional().nullable(),
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
    customerNotes: z.string().max(250).optional(),
    idempotencyKey: z.string().min(5).optional(),
  }),
});

export const CancelBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    reason: z.string().min(2, 'Cancellation reason required').default('Change of plans'),
  }),
});
