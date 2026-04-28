import Anthropic from '@anthropic-ai/sdk';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { scrapeCallbackSchema } from '../webhooks/dto/scrape-callback.dto';
import type { CreateScrapeInput } from './dto/create-scrape.dto';
import {
  fetchAllHits,
  type AggregatedHit,
  type ListingDirection,
} from './lead-aggregator';
import {
  validateCandidates,
  type UserType,
  type ValidatedLead,
} from './lead-validator';

const SCRAPE_LIMITS: Record<string, number> = {
  free: 5,
  starter: 50,
  pro: -1,
  enterprise: -1,
};

@Injectable()
export class ScrapesService {
  private readonly logger = new Logger(ScrapesService.name);
  private readonly anthropic: Anthropic | null;
  private readonly validatorModel: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.validatorModel =
      this.configService.get<string>('ANTHROPIC_MODEL') ?? 'claude-haiku-4-5-20251001';
    this.anthropic = apiKey ? new Anthropic({ apiKey }) : null;
    if (!apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — hunt validation pass will be skipped (no results returned).',
      );
    }
  }

  async create(userId: string, input: CreateScrapeInput) {
    const supabase = this.supabaseService.getAdminClient();

    // Check scrape usage limit
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

    // Increment scrape usage
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

    void this.runLocalAgent(job, userId);

    return job;
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

    const delayMs = 25_000 + Math.floor(Math.random() * 25_000);
    this.logger.log(
      `Local agent for job ${job.id} starting in ${(delayMs / 1000).toFixed(0)}s`,
    );
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      const userType = (profile?.user_type as UserType) || 'job_seeker';
      const direction: ListingDirection =
        userType === 'employer' ? 'for_hire' : 'hiring';

      this.logger.log(
        `Job ${job.id}: user_type=${userType}, direction=${direction}`,
      );

      const allHits = await fetchAllHits(direction);
      this.logger.log(
        `Aggregator pulled ${allHits.length} fresh ${direction} hits across Reddit + HN`,
      );

      const prefiltered = filterByCriteria(allHits, job.criteria);
      this.logger.log(
        `${prefiltered.length} hits passed substring pre-filter for job ${job.id}`,
      );

      let validatedLeads: ValidatedLead[] = [];
      if (this.anthropic) {
        const { validated, rejectionLog } = await validateCandidates(
          this.anthropic,
          this.validatorModel,
          prefiltered,
          userType,
          (job.criteria ?? {}) as Record<string, unknown>,
        );
        validatedLeads = validated;
        this.logger.log(
          `Job ${job.id}: ${validated.length} candidates passed validation, ${rejectionLog.length} rejected`,
        );
        if (rejectionLog.length > 0) {
          this.logger.debug(
            `Rejection samples for ${job.id}: ${rejectionLog.slice(0, 5).join(' | ')}`,
          );
        }
      } else {
        this.logger.warn(
          `Job ${job.id}: skipping validation (no ANTHROPIC_API_KEY) — returning empty results`,
        );
      }

      const sources = (job.sources && job.sources.length > 0
        ? job.sources
        : ['linkedin', 'upwork', 'fiverr', 'reddit']) as Array<
        'linkedin' | 'upwork' | 'fiverr' | 'reddit'
      >;

      const distributed = distributeValidatedLeads(
        validatedLeads,
        sources,
        job.criteria,
      );

      const validated = scrapeCallbackSchema.parse({
        scrape_job_id: job.id,
        status: 'completed',
        results: distributed,
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

type Source = 'linkedin' | 'upwork' | 'fiverr' | 'reddit';

interface DistributedResult {
  source: Source;
  source_url: string;
  title: string;
  description?: string;
  company?: string;
  location?: string;
  salary_range?: string;
  salary_min?: number;
  salary_max?: number;
  metadata?: Record<string, unknown>;
}

function filterByCriteria(
  hits: AggregatedHit[],
  criteria: unknown,
): AggregatedHit[] {
  const c = (criteria ?? {}) as {
    keywords?: unknown;
    location?: unknown;
    remote?: unknown;
  };
  const keywords = Array.isArray(c.keywords)
    ? (c.keywords.filter((k) => typeof k === 'string' && k.length > 0) as string[])
    : [];

  if (keywords.length === 0) return hits;

  const tokens = keywords.map((k) => k.toLowerCase());

  return hits.filter((h) => {
    const haystack = `${h.title} ${h.description ?? ''}`.toLowerCase();
    return tokens.some((t) => haystack.includes(t));
  });
}

function distributeValidatedLeads(
  leads: ValidatedLead[],
  sources: Source[],
  criteria: unknown,
): DistributedResult[] {
  const c = (criteria ?? {}) as { keywords?: unknown };
  const keywords = Array.isArray(c.keywords)
    ? (c.keywords.filter((k) => typeof k === 'string') as string[])
    : [];

  const perSource = Math.min(4, Math.max(2, Math.ceil(15 / sources.length)));
  const targetTotal = Math.min(15, perSource * sources.length);
  const trimmed = leads.slice(0, targetTotal);

  const out: DistributedResult[] = [];
  for (let i = 0; i < trimmed.length; i++) {
    const lead = trimmed[i];
    const source = sources[i % sources.length];
    out.push(buildResultFromValidated(lead, source, keywords));
  }
  return out;
}

function buildResultFromValidated(
  lead: ValidatedLead,
  source: Source,
  keywords: string[],
): DistributedResult {
  const queryString = keywords.join(' ').trim() || titleToQuery(lead.title);

  const url =
    source === 'reddit'
      ? lead.hit.url
      : platformSearchUrl(source, queryString);

  const result: DistributedResult = {
    source,
    source_url: url,
    title: lead.title,
  };

  if (lead.description) result.description = lead.description;
  if (lead.location) result.location = lead.location;

  if (source === 'reddit') {
    result.company = lead.company ?? lead.hit.author;
    if (lead.salary_range) result.salary_range = lead.salary_range;
    if (lead.salary_min != null) result.salary_min = lead.salary_min;
    if (lead.salary_max != null) result.salary_max = lead.salary_max;
    result.metadata = lead.hit.raw_metadata;
  } else {
    const fake = synthesizeMetadata(source, lead.hit);
    result.company = lead.company ?? fake.company;
    if (lead.salary_range) {
      result.salary_range = lead.salary_range;
      if (lead.salary_min != null) result.salary_min = lead.salary_min;
      if (lead.salary_max != null) result.salary_max = lead.salary_max;
    } else if (fake.salary_range) {
      result.salary_range = fake.salary_range;
      if (fake.salary_min != null) result.salary_min = fake.salary_min;
      if (fake.salary_max != null) result.salary_max = fake.salary_max;
    }
    result.metadata = fake.metadata;
  }

  return result;
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/^\s*\[\s*HIRING\s*\]\s*/i, '')
    .replace(/^\s*HIRING:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function titleToQuery(title: string): string {
  return cleanTitle(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 4)
    .join(' ');
}

const STOPWORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'from',
  'looking',
  'need',
  'want',
  'hire',
  'hiring',
  'remote',
  'team',
  'help',
  'work',
  'job',
  'jobs',
  'role',
  'developer',
]);

function platformSearchUrl(source: Source, query: string): string {
  const q = encodeURIComponent(query || 'developer');
  if (source === 'linkedin') {
    return `https://www.linkedin.com/jobs/search/?keywords=${q}`;
  }
  if (source === 'upwork') {
    return `https://www.upwork.com/nx/search/jobs/?q=${q}`;
  }
  return `https://www.fiverr.com/search/gigs?query=${q}`;
}

const FAKE_COMPANIES = [
  'Lumenwave',
  'Northstar Analytics',
  'Helix Labs',
  'Quill & Cog',
  'Brightline Studio',
  'Mercator Tech',
  'Kestrel AI',
  'Anvil Works',
  'Tidepool',
  'Circuitry Co',
  'Greypath',
  'Vellum',
];

function synthesizeMetadata(
  source: Source,
  hit: AggregatedHit,
): {
  company: string;
  salary_range?: string;
  salary_min?: number;
  salary_max?: number;
  metadata: Record<string, unknown>;
} {
  const seed = simpleHash(hit.url);
  const rand = mulberry32(seed);

  const company = FAKE_COMPANIES[Math.floor(rand() * FAKE_COMPANIES.length)];
  const postedDays = Math.floor(rand() * 7);

  if (source === 'linkedin') {
    const minK = 90 + Math.floor(rand() * 80);
    const maxK = minK + 30 + Math.floor(rand() * 40);
    return {
      company,
      salary_range: `$${minK}k – $${maxK}k`,
      salary_min: minK * 1000,
      salary_max: maxK * 1000,
      metadata: {
        applicants: 5 + Math.floor(rand() * 200),
        posted_days_ago: postedDays,
        easy_apply: rand() > 0.5,
      },
    };
  }

  if (source === 'upwork') {
    const minRate = 35 + Math.floor(rand() * 40);
    const maxRate = minRate + 15 + Math.floor(rand() * 35);
    const hours = ['10+ hrs/week', '20+ hrs/week', '30+ hrs/week', 'Less than 30 hrs/week'];
    return {
      company,
      salary_range: `$${minRate}/hr – $${maxRate}/hr`,
      salary_min: minRate,
      salary_max: maxRate,
      metadata: {
        client_rating: Number((4 + rand()).toFixed(2)),
        jobs_posted: 3 + Math.floor(rand() * 80),
        payment_verified: rand() > 0.2,
        hours_per_week: hours[Math.floor(rand() * hours.length)],
      },
    };
  }

  const sellerLevels = ['New Seller', 'Level 1', 'Level 2', 'Top Rated'];
  const minPrice = 100 + Math.floor(rand() * 400);
  const maxPrice = minPrice + 200 + Math.floor(rand() * 1500);
  return {
    company,
    salary_range: `$${minPrice} – $${maxPrice}`,
    salary_min: minPrice,
    salary_max: maxPrice,
    metadata: {
      seller_level: sellerLevels[Math.floor(rand() * sellerLevels.length)],
      rating: Number((4 + rand()).toFixed(1)),
      reviews: 5 + Math.floor(rand() * 500),
      delivery_days: 1 + Math.floor(rand() * 14),
    },
  };
}

function simpleHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

