import { z } from 'zod';

export const exportLeadsSchema = z.object({
  lead_ids: z.array(z.string().uuid()).min(1).max(500),
  format: z.enum(['csv', 'json', 'pdf']),
});

export type ExportLeadsInput = z.infer<typeof exportLeadsSchema>;
