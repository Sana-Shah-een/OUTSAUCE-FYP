export type ScrapeSource = 'linkedin' | 'upwork' | 'fiverr' | 'reddit';
export type ScrapeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ScrapeCriteria {
  keywords: string[];
  location?: string;
  remote?: boolean;
  salary_min?: number;
  salary_max?: number;
  experience_level?: string;
  job_type?: string;
  [key: string]: unknown;
}

export interface ScrapeJob {
  id: string;
  user_id: string;
  name: string;
  sources: ScrapeSource[];
  criteria: ScrapeCriteria;
  status: ScrapeStatus;
  n8n_execution_id: string | null;
  result_count: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScrapeResult {
  id: string;
  scrape_job_id: string;
  user_id: string;
  source: ScrapeSource;
  source_url: string | null;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  salary_range: string | null;
  salary_min: number | null;
  salary_max: number | null;
  metadata: Record<string, unknown>;
  scraped_at: string;
  created_at: string;
}
