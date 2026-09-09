import { z } from 'zod';

export const generateOutreachSchema = z.object({
  jobDescription: z.string().optional().default(''),
  resumeText: z.string().optional().default(''),
  targetRoles: z.array(z.string()).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  tone: z.enum(['professional', 'casual', 'direct']).optional().default('professional'),
  leadId: z.string().uuid().optional().nullable(),
});

export type GenerateOutreachInput = z.infer<typeof generateOutreachSchema>;
