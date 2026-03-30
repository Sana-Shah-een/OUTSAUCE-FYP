import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import type { CreateScrapeInput } from './dto/create-scrape.dto';

@Injectable()
export class ScrapesService {
  private readonly logger = new Logger(ScrapesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: string, input: CreateScrapeInput) {
    const supabase = this.supabaseService.getAdminClient();

    const { data: job, error } = await supabase
      .from('scrape_jobs')
      .insert({
        user_id: userId,
        name: input.name,
        sources: input.sources,
        criteria: input.criteria,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await this.triggerN8n(job);

    return job;
  }

  private async triggerN8n(job: {
    id: string;
    sources: string[];
    criteria: unknown;
  }) {
    const webhookUrl =
      this.configService.getOrThrow<string>('N8N_WEBHOOK_URL');
    const webhookSecret =
      this.configService.getOrThrow<string>('N8N_WEBHOOK_SECRET');
    const callbackBase =
      this.configService.getOrThrow<string>('API_BASE_URL');

    const supabase = this.supabaseService.getAdminClient();

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret,
        },
        body: JSON.stringify({
          scrape_job_id: job.id,
          sources: job.sources,
          criteria: job.criteria,
          callback_url: callbackBase + '/api/webhooks/n8n/results',
        }),
      });

      if (!response.ok) {
        throw new Error(
          `n8n webhook returned status ${response.status}`,
        );
      }

      await supabase
        .from('scrape_jobs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', job.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error triggering n8n';
      this.logger.error(`Failed to trigger n8n for job ${job.id}: ${message}`);

      await supabase
        .from('scrape_jobs')
        .update({
          status: 'failed',
          error_message: message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    }
  }

  async findAllByUser(userId: string, page: number, limit: number) {
    const supabase = this.supabaseService.getAdminClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('scrape_jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };
  }

  async findOne(userId: string, jobId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Scrape job not found');
    }

    return data;
  }

  async getResults(
    userId: string,
    jobId: string,
    page: number,
    limit: number,
  ) {
    // Verify job belongs to user
    await this.findOne(userId, jobId);

    const supabase = this.supabaseService.getAdminClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('scrape_results')
      .select('*', { count: 'exact' })
      .eq('scrape_job_id', jobId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };
  }

  async cancel(userId: string, jobId: string) {
    const job = await this.findOne(userId, jobId);

    if (job.status !== 'pending' && job.status !== 'running') {
      throw new NotFoundException(
        'Only pending or running jobs can be cancelled',
      );
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('scrape_jobs')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', jobId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
