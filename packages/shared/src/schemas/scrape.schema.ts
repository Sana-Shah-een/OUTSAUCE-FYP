import { z } from 'zod';

export const createScrapeSchema = z.object({
  name: z.string().min(1).max(200),
  sources: z.array(z.enum(['linkedin', 'upwork', 'fiverr', 'reddit'])).min(1),
  criteria: z.object({
    keywords: z.array(z.string().min(1)).min(1),
    location: z.string().optional(),
    remote: z.boolean().optional(),
    salary_min: z.number().int().positive().optional(),
    salary_max: z.number().int().positive().optional(),
    experience_level: z.string().optional(),
    job_type: z.string().optional(),
  }).passthrough(),
});

export type CreateScrapeInput = z.infer<typeof createScrapeSchema>;
