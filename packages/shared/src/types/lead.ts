import type { ScrapeSource } from './scrape';

export type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'closed' | 'archived';

export interface Lead {
  id: string;
  user_id: string;
  scrape_result_id: string | null;
  folder_id: string | null;
  source: ScrapeSource | null;
  source_url: string | null;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  salary_range: string | null;
  salary_min: number | null;
  salary_max: number | null;
  status: LeadStatus;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LeadFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}
