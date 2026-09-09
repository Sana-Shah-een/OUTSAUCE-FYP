import { z } from 'zod';

export const saveProfileSchema = z.object({
  resume_text: z.string().optional().default(''),
  target_roles: z.array(z.string()).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
});

export type SaveProfileInput = z.infer<typeof saveProfileSchema>;
