import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
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
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  private async checkUsageLimit(userId: string, count: number) {
    const sb = this.supabaseService.getAdminClient();
    const now = new Date().toISOString();

    const { data: usage } = await sb
      .from('usage')
      .select('*')
      .eq('user_id', userId)
      .lte('period_start', now)
      .gt('period_end', now)
      .single();

    const { data: subscription } = await sb
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single();

    const plan = subscription?.plan ?? 'free';
    const limit = PLAN_LIMITS[plan] ?? 20;
    const used = usage?.leads_used ?? 0;

    if (limit !== -1 && used + count > limit) {
      throw new ForbiddenException('Monthly lead limit reached');
    }
  }

  private async incrementUsage(userId: string, count: number) {
    const sb = this.supabaseService.getAdminClient();
    const now = new Date().toISOString();

    const { data: usage } = await sb
      .from('usage')
      .select('id, leads_used')
      .eq('user_id', userId)
      .lte('period_start', now)
      .gt('period_end', now)
      .single();

    if (usage) {
      await sb
        .from('usage')
        .update({ leads_used: (usage.leads_used ?? 0) + count })
        .eq('id', usage.id);
    }
  }

  async create(userId: string, input: CreateLeadInput) {
    await this.checkUsageLimit(userId, 1);

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
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    await this.incrementUsage(userId, 1);

    return lead;
  }

  async bulkCreate(userId: string, input: BulkCreateLeadInput) {
    const count = input.scrape_result_ids.length;
    await this.checkUsageLimit(userId, count);

    const sb = this.supabaseService.getAdminClient();

    const { data: scrapeResults, error: srError } = await sb
      .from('scrape_results')
      .select('*')
      .in('id', input.scrape_result_ids)
      .eq('user_id', userId);

    if (srError || !scrapeResults || scrapeResults.length === 0) {
      throw new NotFoundException('Scrape results not found');
    }

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
    }));

    const { data: leads, error } = await sb
      .from('leads')
      .insert(rows)
      .select('*');

    if (error) {
      throw error;
    }

    await this.incrementUsage(userId, scrapeResults.length);

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

      return { data: data ?? [], total: count ?? 0, page, limit };
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

    return { data: data ?? [], total: count ?? 0, page, limit };
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

  // --- Folders ---

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

  // --- Tags ---

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

  // --- Lead Tags ---

  async addTagsToLead(userId: string, leadId: string, tagIds: string[]) {
    await this.findOne(userId, leadId);

    const sb = this.supabaseService.getAdminClient();

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
}
