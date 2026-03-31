import { z } from 'zod';

export const scrapeCallbackSchema = z.object({
  scrape_job_id: z.string().uuid(),
  status: z.enum(['completed', 'failed']),
  results: z
    .array(
      z.object({
        source: z.enum(['linkedin', 'upwork', 'fiverr', 'reddit']),
        source_url: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        company: z.string().optional(),
        location: z.string().optional(),
        salary_range: z.string().optional(),
        salary_min: z.number().optional(),
        salary_max: z.number().optional(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .optional()
    .default([]),
  error_message: z.string().optional(),
});

export type ScrapeCallbackInput = z.infer<typeof scrapeCallbackSchema>;
