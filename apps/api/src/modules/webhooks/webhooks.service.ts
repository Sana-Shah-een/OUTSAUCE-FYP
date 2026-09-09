import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { LeadsService } from '../leads/leads.service';
import { UsageService } from '../billing/usage.service';
import type { ScrapeCallbackInput } from './dto/scrape-callback.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly leadsService: LeadsService,
    private readonly usageService: UsageService,
  ) {}

  async processN8nCallback(payload: ScrapeCallbackInput) {
    const supabase = this.supabaseService.getAdminClient();

    if (payload.status === 'completed' && payload.results.length > 0) {
      const { data: job, error: jobError } = await supabase
        .from('scrape_jobs')
        .select('user_id')
        .eq('id', payload.scrape_job_id)
        .single();

      if (jobError || !job) {
        this.logger.error(
          `Scrape job ${payload.scrape_job_id} not found`,
        );
        throw new Error(`Scrape job ${payload.scrape_job_id} not found`);
      }

      const results = payload.results.map((result) => ({
        scrape_job_id: payload.scrape_job_id,
        user_id: job.user_id,
        source: result.source,
        source_url: result.source_url ?? null,
        title: result.title,
        description: result.description ?? null,
        company: result.company ?? null,
        location: result.location ?? null,
        salary_range: result.salary_range ?? null,
        salary_min: result.salary_min ?? null,
        salary_max: result.salary_max ?? null,
        metadata: result.metadata ?? null,
        scraped_at: new Date().toISOString(),
      }));

      const { data: insertedResults, error: insertError } = await supabase
        .from('scrape_results')
        .insert(results)
        .select('id, source, source_url, title, description, company, location, salary_range, salary_min, salary_max, metadata');

      if (insertError) {
        this.logger.error(
          `Failed to insert results for job ${payload.scrape_job_id}: ${insertError.message}`,
        );
        throw insertError;
      }

      await supabase
        .from('scrape_jobs')
        .update({
          status: 'completed',
          result_count: payload.results.length,
          completed_at: new Date().toISOString(),
        })
        .eq('id', payload.scrape_job_id);

      // Auto-create lead records for this hunt so they are immediately queryable via GET /leads/hunt/:huntId
      if (insertedResults && insertedResults.length > 0) {
        const leadRows = insertedResults.map((sr) => ({
          user_id: job.user_id,
          scrape_result_id: sr.id,
          hunt_id: payload.scrape_job_id,
          source: sr.source,
          source_url: sr.source_url,
          title: sr.title,
          description: sr.description,
          company: sr.company,
          location: sr.location,
          salary_range: sr.salary_range,
          salary_min: sr.salary_min,
          salary_max: sr.salary_max,
          metadata: sr.metadata,
        }));
        const { error: leadsErr } = await supabase.from('leads').insert(leadRows);
        if (leadsErr) {
          this.logger.warn(`Failed to auto-create leads for hunt ${payload.scrape_job_id}: ${leadsErr.message}`);
        } else {
          for (const lead of leadRows) {
            await this.usageService.recordUsage(job.user_id, 'lead_created', { hunt_id: payload.scrape_job_id });
          }
        }
      }

      // Fire asynchronous AI lead fit scoring
      this.leadsService.scoreNewLeadsForHunt(payload.scrape_job_id).catch((err) =>
        this.logger.error(`Background scoring failed for hunt ${payload.scrape_job_id}: ${err.message}`),
      );
    } else if (payload.status === 'failed') {
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'failed',
          error_message: payload.error_message ?? 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', payload.scrape_job_id);
    } else {
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'completed',
          result_count: 0,
          completed_at: new Date().toISOString(),
        })
        .eq('id', payload.scrape_job_id);
    }

    return { success: true };
  }
}
