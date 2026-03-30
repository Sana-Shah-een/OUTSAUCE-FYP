import type { ScrapeSource } from '../types/scrape';

export interface SourceMeta {
  id: ScrapeSource;
  label: string;
  icon: string;
  supportedTargets: ('jobs' | 'gigs' | 'candidates')[];
}

export const SCRAPE_SOURCES: SourceMeta[] = [
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', supportedTargets: ['jobs', 'candidates'] },
  { id: 'upwork', label: 'Upwork', icon: 'upwork', supportedTargets: ['gigs', 'candidates'] },
  { id: 'fiverr', label: 'Fiverr', icon: 'fiverr', supportedTargets: ['gigs', 'candidates'] },
  { id: 'reddit', label: 'Reddit', icon: 'reddit', supportedTargets: ['jobs', 'gigs'] },
];
