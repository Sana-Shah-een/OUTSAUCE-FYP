import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import type { GenerateInput } from './dto/ai-tools.dto';

const AI_GENERATION_LIMITS: Record<string, number> = {
  free: 10,
  starter: 100,
  pro: -1,
  enterprise: -1,
};

@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async generate(userId: string, input: GenerateInput) {
    const sb = this.supabaseService.getAdminClient();
    const now = new Date().toISOString();

    // Check usage limit
    const [{ data: subscription }, { data: usage }] = await Promise.all([
      sb.from('subscriptions').select('plan').eq('user_id', userId).single(),
      sb
        .from('usage')
        .select('*')
        .eq('user_id', userId)
        .lte('period_start', now)
        .gt('period_end', now)
        .single(),
    ]);

    const plan = subscription?.plan ?? 'free';
    const limit = AI_GENERATION_LIMITS[plan] ?? 10;
    const used = usage?.ai_generations_used ?? 0;

    if (limit !== -1 && used >= limit) {
      throw new ForbiddenException(
        'Monthly AI generation limit reached. Please upgrade your plan.',
      );
    }

    // Build prompt based on tool_type and target_platform
    const platformSuffix = input.target_platform
      ? ` optimized for ${input.target_platform}`
      : '';
    const prompt = `Generate a ${input.tool_type.replace(/_/g, ' ')}${platformSuffix} based on the following data: ${JSON.stringify(input.input_data)}`;

    this.logger.log(`AI generation prompt: ${prompt}`);

    // TODO: Replace with actual OpenAI/Anthropic API call
    const generatedText = `[Mock ${input.tool_type}${platformSuffix}] This is a placeholder for AI-generated content. Input data keys: ${Object.keys(input.input_data).join(', ')}`;

    // Save to ai_generations table
    const { data: generation, error: genError } = await sb
      .from('ai_generations')
      .insert({
        user_id: userId,
        tool_type: input.tool_type,
        target_platform: input.target_platform ?? null,
        input_data: input.input_data,
        output_text: generatedText,
      })
      .select('*')
      .single();

    if (genError) throw genError;

    // Increment usage
    if (usage) {
      await sb
        .from('usage')
        .update({ ai_generations_used: (usage.ai_generations_used ?? 0) + 1 })
        .eq('id', usage.id);
    }

    return generation;
  }

  async getHistory(
    userId: string,
    page: number,
    limit: number,
    toolType?: string,
  ) {
    const sb = this.supabaseService.getAdminClient();
    const offset = (page - 1) * limit;

    let query = sb
      .from('ai_generations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (toolType) {
      query = query.eq('tool_type', toolType);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    return { data: data ?? [], total: count ?? 0, page, limit };
  }
}
