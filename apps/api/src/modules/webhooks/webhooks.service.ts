import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import type { ScrapeCallbackInput } from './dto/scrape-callback.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async processN8nCallback(payload: ScrapeCallbackInput) {
    const supabase = this.supabaseService.getAdminClient();

    if (payload.status === 'completed' && payload.results.length > 0) {
      // Get the job to find user_id
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

      // Bulk insert results
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

      const { error: insertError } = await supabase
        .from('scrape_results')
        .insert(results);

      if (insertError) {
        this.logger.error(
          `Failed to insert results for job ${payload.scrape_job_id}: ${insertError.message}`,
        );
        throw insertError;
      }

      // Update job status
      await supabase
        .from('scrape_jobs')
        .update({
          status: 'completed',
          result_count: payload.results.length,
          completed_at: new Date().toISOString(),
        })
        .eq('id', payload.scrape_job_id);
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
      // completed with no results
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
