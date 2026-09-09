import Groq from 'groq-sdk';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { scrapeCallbackSchema } from '../webhooks/dto/scrape-callback.dto';
import type { CreateScrapeInput } from './dto/create-scrape.dto';
import {
  generateLeads,
  type GeneratedLead,
  type Source,
  type UserType,
} from './lead-generator';
import { fetchOneRedditLead } from './lead-apify';

const SCRAPE_LIMITS: Record<string, number> = {
  free: 5,
  starter: 50,
  pro: -1,
  enterprise: -1,
};

@Injectable()
export class ScrapesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScrapesService.name);
  private readonly groqModel: Groq | null;
  private readonly groqModelName: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const modelEnv = this.configService.get<string>('GROQ_MODEL');
    this.groqModelName =
      modelEnv && modelEnv.trim().length > 0
        ? modelEnv.trim()
        : 'llama-3.3-70b-versatile';

    if (apiKey) {
      this.groqModel = new Groq({ apiKey });
    } else {
      this.groqModel = null;
      this.logger.warn(
        'GROQ_API_KEY not set — hunt validation pass will be skipped (no results returned).',
      );
    }
  }

  async onApplicationBootstrap() {
    const supabase = this.supabaseService.getAdminClient();
    try {
      const { data, error } = await supabase
        .from('scrape_jobs')
        .update({
          status: 'failed',
          error_message: 'Backend server restarted while hunt was in progress',
          completed_at: new Date().toISOString(),
        })
        .in('status', ['pending', 'running'])
        .select('id');

      if (data && data.length > 0) {
        this.logger.log(
          `Cleaned up ${data.length} orphaned hunt(s) stuck in pending/running state on server boot.`,
        );
      }
    } catch (err) {
      this.logger.error('Failed to run bootstrap cleanup for stuck scrape jobs', err);
    }
  }

  async create(userId: string, input: CreateScrapeInput) {
    const supabase = this.supabaseService.getAdminClient();

    const now = new Date().toISOString();
    const [{ data: subscription }, { data: usage }] = await Promise.all([
      supabase.from('subscriptions').select('plan').eq('user_id', userId).single(),
      supabase
        .from('usage')
        .select('*')
        .eq('user_id', userId)
        .lte('period_start', now)
        .gt('period_end', now)
        .single(),
    ]);

    const plan = subscription?.plan ?? 'free';
    const limit = SCRAPE_LIMITS[plan] ?? 5;
    const used = usage?.scrapes_used ?? 0;

    if (limit !== -1 && used >= limit) {
      throw new ForbiddenException('Monthly scrape limit reached. Please upgrade your plan.');
    }

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

    if (usage) {
      await supabase
        .from('usage')
        .update({ scrapes_used: (usage.scrapes_used ?? 0) + 1 })
        .eq('id', usage.id);
    }

    await supabase
      .from('scrape_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', job.id);

    const n8nWebhookUrl = this.configService.get<string>('N8N_WEBHOOK_URL');
    if (n8nWebhookUrl && n8nWebhookUrl.trim().length > 0) {
      void this.triggerN8n(n8nWebhookUrl, job, userId);
    } else {
      void this.runLocalAgent(job, userId);
    }

    return job;
  }

  private async triggerN8n(
    webhookUrl: string,
    job: {
      id: string;
      sources: string[];
      criteria: unknown;
    },
    userId: string,
  ) {
    const supabase = this.supabaseService.getAdminClient();
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      const userType = (profile?.user_type as UserType) || 'job_seeker';

      const payload = {
        scrape_job_id: job.id,
        user_type: userType,
        sources: job.sources,
        criteria: job.criteria ?? {},
      };

      this.logger.log(`Triggering n8n webhook at ${webhookUrl} for job ${job.id}`);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`n8n responded with status ${response.status}`);
      }

      this.logger.log(`Successfully triggered n8n for job ${job.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown trigger error';
      this.logger.error(`Failed to trigger n8n for job ${job.id}: ${message}`);
      
      this.logger.log(`Falling back to local agent for job ${job.id}`);
      void this.runLocalAgent(job, userId);
    }
  }

  private async runLocalAgent(
    job: {
      id: string;
      sources: string[];
      criteria: unknown;
    },
    userId: string,
  ) {
    const supabase = this.supabaseService.getAdminClient();

    try {
      const delayMs = 3_000 + Math.floor(Math.random() * 3_000);
      this.logger.log(
        `Local agent for job ${job.id} starting in ${(delayMs / 1000).toFixed(0)}s`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Check if job was cancelled while waiting
      const { data: currentJob } = await supabase
        .from('scrape_jobs')
        .select('status')
        .eq('id', job.id)
        .single();

      if (currentJob?.status === 'cancelled') {
        this.logger.log(`Job ${job.id} was cancelled before execution. Aborting agent.`);
        return;
      }

      if (!this.groqModel) {
        throw new Error('GROQ_API_KEY is not configured');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      const userType = (profile?.user_type as UserType) || 'job_seeker';

      const sources = (job.sources && job.sources.length > 0
        ? job.sources
        : ['linkedin', 'upwork', 'fiverr', 'reddit']) as Source[];

      this.logger.log(
        `Job ${job.id}: generating leads for user_type=${userType}, sources=${sources.join(',')}`,
      );

      const criteria = (job.criteria ?? {}) as {
        keywords?: string[];
        location?: string;
        remote?: boolean;
        salary_min?: number;
        salary_max?: number;
        experience_level?: string;
      };

      const generated = await generateLeads(
        this.groqModel,
        this.groqModelName,
        { userType, sources, criteria },
      );

      const finalResults = await this.tryInjectRealReddit(
        generated,
        sources,
        criteria,
        job.id,
      );

      const validated = scrapeCallbackSchema.parse({
        scrape_job_id: job.id,
        status: 'completed',
        results: finalResults,
      });

      await this.webhooksService.processN8nCallback(validated);
      this.logger.log(
        `Local agent for job ${job.id} completed with ${validated.results.length} results`,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown agent error';
      this.logger.error(`Local agent failed for job ${job.id}: ${message}`);

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

  private async tryInjectRealReddit(
    generated: GeneratedLead[],
    sources: Source[],
    criteria: { keywords?: string[]; location?: string; remote?: boolean },
    jobId: string,
  ): Promise<GeneratedLead[]> {
    if (!sources.includes('reddit')) return generated;

    const apifyToken = this.configService.get<string>('APIFY_TOKEN');
    if (!apifyToken || apifyToken.trim().length === 0) return generated;

    const real = await fetchOneRedditLead(apifyToken, criteria);
    if (!real) {
      this.logger.log(`Job ${jobId}: no real reddit lead available — using all synthetic`);
      return generated;
    }

    const swapIdx = generated.findIndex((l) => l.source === 'reddit');
    if (swapIdx === -1) {
      this.logger.warn(
        `Job ${jobId}: real reddit lead fetched but no synthetic reddit lead to swap`,
      );
      return generated;
    }

    const next = [...generated];
    next[swapIdx] = {
      source: 'reddit',
      source_url: real.source_url,
      title: real.title,
      description: real.description,
      company: real.company,
      metadata: real.metadata,
    };
    this.logger.log(`Job ${jobId}: swapped 1 synthetic reddit lead with real listing`);
    return next;
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

  async rerun(userId: string, jobId: string) {
    const job = await this.findOne(userId, jobId);

    if (job.status === 'pending' || job.status === 'running') {
      throw new ForbiddenException(
        'Cannot re-run a hunt that is still in progress.',
      );
    }

    const random = 100000 + Math.floor(Math.random() * 900000);

    return this.create(userId, {
      name: `hunt_${random}`,
      sources: job.sources as CreateScrapeInput['sources'],
      criteria: job.criteria as CreateScrapeInput['criteria'],
    });
  }
}
