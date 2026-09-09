import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import { LeadScoringService } from './lead-scoring.service';
import type {
  CreateLeadInput,
  BulkCreateLeadInput,
  UpdateLeadInput,
  CreateFolderInput,
  CreateTagInput,
} from './dto/lead.dto';

const PLAN_LIMITS: Record<string, number> = {
  free: 20,
  starter: 200,
  pro: -1,
  enterprise: -1,
};

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
    private readonly leadScoringService: LeadScoringService,
  ) {}

  private async checkAndIncrementLeadUsage(userId: string, count: number) {
    const sb = this.supabaseService.getAdminClient();

    const { data: subscription } = await sb
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single();

    const plan = subscription?.plan ?? 'free';
    const limit = PLAN_LIMITS[plan] ?? 20;

    const { error } = await sb.rpc('check_and_increment_lead_usage', {
      p_user_id: userId,
      p_count: count,
      p_limit: limit,
    });

    if (error) {
      if (
        error.code === 'P0001' ||
        error.message?.includes('LEAD_LIMIT_EXCEEDED')
      ) {
        throw new ForbiddenException('Monthly lead limit reached');
      }
      throw error;
    }
  }

  async create(userId: string, input: CreateLeadInput) {
    const sb = this.supabaseService.getAdminClient();

    const { data: scrapeResult, error: srError } = await sb
      .from('scrape_results')
      .select('*')
      .eq('id', input.scrape_result_id)
      .eq('user_id', userId)
      .single();

    if (srError || !scrapeResult) {
      throw new NotFoundException('Scrape result not found');
    }

    await this.checkAndIncrementLeadUsage(userId, 1);

    const { data: lead, error } = await sb
      .from('leads')
      .insert({
        user_id: userId,
        scrape_result_id: input.scrape_result_id,
        folder_id: input.folder_id ?? null,
        notes: input.notes ?? null,
        source: scrapeResult.source,
        source_url: scrapeResult.source_url,
        title: scrapeResult.title,
        description: scrapeResult.description,
        company: scrapeResult.company,
        location: scrapeResult.location,
        salary_range: scrapeResult.salary_range,
        salary_min: scrapeResult.salary_min,
        salary_max: scrapeResult.salary_max,
        metadata: scrapeResult.metadata,
        fit_score: scrapeResult.fit_score,
        fit_reasoning: scrapeResult.fit_reasoning,
        scored_at: scrapeResult.scored_at,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return lead;
  }

  async bulkCreate(userId: string, input: BulkCreateLeadInput) {
    const sb = this.supabaseService.getAdminClient();

    const { data: scrapeResults, error: srError } = await sb
      .from('scrape_results')
      .select('*')
      .in('id', input.scrape_result_ids)
      .eq('user_id', userId);

    if (srError || !scrapeResults || scrapeResults.length === 0) {
      throw new NotFoundException('Scrape results not found');
    }

    await this.checkAndIncrementLeadUsage(userId, scrapeResults.length);

    const rows = scrapeResults.map((sr) => ({
      user_id: userId,
      scrape_result_id: sr.id,
      folder_id: input.folder_id ?? null,
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
      fit_score: sr.fit_score,
      fit_reasoning: sr.fit_reasoning,
      scored_at: sr.scored_at,
    }));

    const { data: leads, error } = await sb
      .from('leads')
      .insert(rows)
      .select('*');

    if (error) {
      throw error;
    }

    return leads;
  }

  async findAll(
    userId: string,
    filters: {
      status?: string;
      folder_id?: string;
      tag_id?: string;
      page: number;
      limit: number;
    },
  ) {
    const sb = this.supabaseService.getAdminClient();
    const { page, limit, status, folder_id, tag_id } = filters;
    const offset = (page - 1) * limit;

    if (tag_id) {
      const { data: tag } = await sb
        .from('tags')
        .select('id')
        .eq('id', tag_id)
        .eq('user_id', userId)
        .single();

      if (!tag) {
        return { data: [], total: 0, page, limit };
      }

      const { data: leadTags } = await sb
        .from('lead_tags')
        .select('lead_id')
        .eq('tag_id', tag_id);

      const leadIds = (leadTags ?? []).map((lt) => lt.lead_id);

      if (leadIds.length === 0) {
        return { data: [], total: 0, page, limit };
      }

      let query = sb
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .in('id', leadIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq('status', status);
      if (folder_id) query = query.eq('folder_id', folder_id);

      const { data, count, error } = await query;
      if (error) throw error;

      const leadsList = data ?? [];
      const leadIdsList = leadsList.map((l) => l.id);
      let leadTagsMap: Record<string, any[]> = {};
      if (leadIdsList.length > 0) {
        const { data: ltData } = await sb
          .from('lead_tags')
          .select('lead_id, tag_id, tags(*)')
          .in('lead_id', leadIdsList);

        if (ltData) {
          for (const lt of ltData) {
            if (!leadTagsMap[lt.lead_id]) leadTagsMap[lt.lead_id] = [];
            if (lt.tags) leadTagsMap[lt.lead_id].push(lt.tags);
          }
        }
      }

      const dataWithTags = leadsList.map((l) => ({
        ...l,
        tags: leadTagsMap[l.id] ?? [],
      }));

      return { data: dataWithTags, total: count ?? 0, page, limit };
    }

    let query = sb
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (folder_id) query = query.eq('folder_id', folder_id);

    const { data, count, error } = await query;
    if (error) throw error;

    const leadsList = data ?? [];
    const leadIdsList = leadsList.map((l) => l.id);
    let leadTagsMap: Record<string, any[]> = {};
    if (leadIdsList.length > 0) {
      const { data: ltData } = await sb
        .from('lead_tags')
        .select('lead_id, tag_id, tags(*)')
        .in('lead_id', leadIdsList);

      if (ltData) {
        for (const lt of ltData) {
          if (!leadTagsMap[lt.lead_id]) leadTagsMap[lt.lead_id] = [];
          if (lt.tags) leadTagsMap[lt.lead_id].push(lt.tags);
        }
      }
    }

    const dataWithTags = leadsList.map((l) => ({
      ...l,
      tags: leadTagsMap[l.id] ?? [],
    }));

    return { data: dataWithTags, total: count ?? 0, page, limit };
  }

  async findOne(userId: string, leadId: string) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Lead not found');
    }

    return data;
  }

  async update(userId: string, leadId: string, input: UpdateLeadInput) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('leads')
      .update(input)
      .eq('id', leadId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      throw new NotFoundException('Lead not found');
    }

    return data;
  }

  async remove(userId: string, leadId: string) {
    const sb = this.supabaseService.getAdminClient();

    const { error } = await sb
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  }

  async createFolder(userId: string, input: CreateFolderInput) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('lead_folders')
      .insert({ user_id: userId, ...input })
      .select('*')
      .single();

    if (error) throw error;

    return data;
  }

  async getFolders(userId: string) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('lead_folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data;
  }

  async updateFolder(
    userId: string,
    folderId: string,
    input: Partial<CreateFolderInput>,
  ) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('lead_folders')
      .update(input)
      .eq('id', folderId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      throw new NotFoundException('Folder not found');
    }

    return data;
  }

  async removeFolder(userId: string, folderId: string) {
    const sb = this.supabaseService.getAdminClient();

    const { error } = await sb
      .from('lead_folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  }

  async createTag(userId: string, input: CreateTagInput) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('tags')
      .insert({ user_id: userId, ...input })
      .select('*')
      .single();

    if (error) throw error;

    return data;
  }

  async getTags(userId: string) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data;
  }

  async updateTag(
    userId: string,
    tagId: string,
    input: Partial<CreateTagInput>,
  ) {
    const sb = this.supabaseService.getAdminClient();

    const { data, error } = await sb
      .from('tags')
      .update(input)
      .eq('id', tagId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      throw new NotFoundException('Tag not found');
    }

    return data;
  }

  async removeTag(userId: string, tagId: string) {
    const sb = this.supabaseService.getAdminClient();

    const { error } = await sb
      .from('tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  }

  async addTagsToLead(userId: string, leadId: string, tagIds: string[]) {
    await this.findOne(userId, leadId);

    const sb = this.supabaseService.getAdminClient();

    const { data: userTags } = await sb
      .from('tags')
      .select('id')
      .in('id', tagIds)
      .eq('user_id', userId);

    if (!userTags || userTags.length !== tagIds.length) {
      throw new ForbiddenException('One or more tags do not belong to you');
    }

    const rows = tagIds.map((tagId) => ({
      lead_id: leadId,
      tag_id: tagId,
    }));

    const { data, error } = await sb
      .from('lead_tags')
      .upsert(rows, { onConflict: 'lead_id,tag_id' })
      .select('*');

    if (error) throw error;

    return data;
  }

  async removeTagFromLead(userId: string, leadId: string, tagId: string) {
    await this.findOne(userId, leadId);

    const sb = this.supabaseService.getAdminClient();

    const { error } = await sb
      .from('lead_tags')
      .delete()
      .eq('lead_id', leadId)
      .eq('tag_id', tagId);

    if (error) throw error;

    return { success: true };
  }

  private async getProfileForScoring(userId: string) {
    const sb = this.supabaseService.getAdminClient();

    const { data: profile, error } = await sb
      .from('profiles')
      .select('bio, headline, skills, onboarding_completed')
      .eq('id', userId)
      .single();

    if (error || !profile || !profile.onboarding_completed) {
      return null;
    }

    return {
      resume_text: profile.bio || '',
      target_roles: profile.headline ? [profile.headline] : [],
      skills: profile.skills || [],
    };
  }

  async scoreNewLeadsForHunt(huntId: string): Promise<void> {
    const sb = this.supabaseService.getAdminClient();

    const { data: hunt, error: huntErr } = await sb
      .from('scrape_jobs')
      .select('id, user_id')
      .eq('id', huntId)
      .single();

    if (huntErr || !hunt) {
      this.logger.warn(`Hunt ${huntId} not found for scoring`);
      return;
    }

    const profile = await this.getProfileForScoring(hunt.user_id);
    if (!profile) {
      this.logger.log(`No completed profile for user, skipping scoring for hunt ${huntId}`);
      return;
    }

    // 1. Fetch unscored scrape_results for this hunt
    const { data: results } = await sb
      .from('scrape_results')
      .select('*')
      .eq('scrape_job_id', huntId)
      .is('fit_score', null);

    if (results && results.length > 0) {
      this.logger.log(`Scoring ${results.length} scrape results for hunt ${huntId}...`);
      for (const res of results) {
        const { score, reasoning } = await this.leadScoringService.scoreLead(
          { title: res.title, description: res.description ?? '', source: res.source },
          profile,
        );

        await sb
          .from('scrape_results')
          .update({
            fit_score: score,
            fit_reasoning: reasoning,
            scored_at: new Date().toISOString(),
          })
          .eq('id', res.id);

        await sb
          .from('leads')
          .update({
            fit_score: score,
            fit_reasoning: reasoning,
            scored_at: new Date().toISOString(),
          })
          .eq('scrape_result_id', res.id);

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // 2. Fetch unscored leads for this hunt
    const { data: leads } = await sb
      .from('leads')
      .select('*')
      .eq('hunt_id', huntId)
      .is('fit_score', null);

    if (leads && leads.length > 0) {
      this.logger.log(`Scoring ${leads.length} remaining leads for hunt ${huntId}...`);
      for (const lead of leads) {
        const { score, reasoning } = await this.leadScoringService.scoreLead(
          { title: lead.title, description: lead.description ?? '', source: lead.source },
          profile,
        );

        await sb
          .from('leads')
          .update({
            fit_score: score,
            fit_reasoning: reasoning,
            scored_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  async getLeadsForHunt(userId: string, huntId: string, minScore?: number) {
    const sb = this.supabaseService.getAdminClient();

    let query = sb
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .eq('hunt_id', huntId);

    if (minScore !== undefined && !isNaN(minScore)) {
      query = query.gte('fit_score', minScore);
    }

    const { data: leads, error } = await query.order('fit_score', {
      ascending: false,
      nullsFirst: false,
    });

    if (error) throw error;

    if (leads && leads.length > 0) {
      return leads;
    }

    let srQuery = sb
      .from('scrape_results')
      .select('*')
      .eq('user_id', userId)
      .eq('scrape_job_id', huntId);

    if (minScore !== undefined && !isNaN(minScore)) {
      srQuery = srQuery.gte('fit_score', minScore);
    }

    const { data: srResults, error: srError } = await srQuery.order('fit_score', {
      ascending: false,
      nullsFirst: false,
    });

    if (!srError && srResults) {
      return srResults;
    }

    return [];
  }
}