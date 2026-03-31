import { z } from 'zod';

export const createLeadSchema = z.object({
  scrape_result_id: z.string().uuid(),
  folder_id: z.string().uuid().optional(),
  notes: z.string().max(5000).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const bulkCreateLeadSchema = z.object({
  scrape_result_ids: z.array(z.string().uuid()).min(1).max(100),
  folder_id: z.string().uuid().optional(),
});

export type BulkCreateLeadInput = z.infer<typeof bulkCreateLeadSchema>;

export const updateLeadSchema = z.object({
  status: z
    .enum(['new', 'contacted', 'in_progress', 'closed', 'archived'])
    .optional(),
  notes: z.string().max(5000).optional(),
  folder_id: z.string().uuid().nullable().optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
