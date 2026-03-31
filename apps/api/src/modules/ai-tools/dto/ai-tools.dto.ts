import { z } from 'zod';

export const generateSchema = z.object({
  tool_type: z.enum([
    'bio',
    'resume',
    'cover_letter',
    'gig_description',
    'profile_summary',
  ]),
  target_platform: z
    .enum(['linkedin', 'upwork', 'fiverr', 'reddit'])
    .optional(),
  input_data: z.record(z.unknown()),
});

export type GenerateInput = z.infer<typeof generateSchema>;
