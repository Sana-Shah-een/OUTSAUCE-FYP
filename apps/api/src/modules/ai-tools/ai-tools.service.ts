import Anthropic from '@anthropic-ai/sdk';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import type { GenerateInput } from './dto/ai-tools.dto';

const AI_GENERATION_LIMITS: Record<string, number> = {
  free: 10,
  starter: 100,
  pro: -1,
  enterprise: -1,
};

const DEFAULT_MODEL = 'claude-opus-4-7';
const MAX_TOKENS = 4096;

type ToolType = GenerateInput['tool_type'];
type TargetPlatform = NonNullable<GenerateInput['target_platform']>;

const TOOL_SYSTEM_PROMPTS: Record<ToolType, string> = {
  bio: `You write professional bios for freelancers, job seekers, and employers on online platforms.

Guidelines:
- Start with a one-line hook that captures the person's core value.
- Use first person, active voice, and concrete specifics (roles, years, technologies, industries).
- Quantify achievements when the input provides numbers; do not fabricate metrics.
- Keep tone confident but grounded — avoid superlatives like "world-class" or "rockstar".
- Length: 3-5 sentences unless the input requests otherwise.
- Output plain prose only. No headings, bullet lists, emoji, or markdown unless explicitly requested.`,

  resume: `You write resume content for job seekers and freelancers.

Guidelines:
- Produce clean, ATS-friendly text with clear section headers (Summary, Experience, Skills, Education) when the input supports them.
- Lead experience bullets with strong action verbs (Built, Led, Shipped, Reduced, Increased).
- Quantify impact using the numbers the user provides; never invent metrics, dates, or employers.
- Keep bullets to one or two lines. Use parallel structure.
- Omit any field the user did not provide — do not fill gaps with placeholder text.
- Output plain text with simple headers; no emoji, no decorative markdown.`,

  cover_letter: `You write cover letters for job and contract applications.

Guidelines:
- Address the hiring manager directly when the input names them; otherwise open with a focused hook, not "Dear Hiring Manager".
- Structure: opening hook, 1-2 paragraphs tying the applicant's specific experience to the role, closing with a clear call to action.
- Mirror the vocabulary of the job description when provided.
- Keep it under 300 words. One page maximum.
- Never fabricate experience, employer names, or dates. Work only from the user's input.
- Output plain prose. No markdown, no bullets unless the input asks for them.`,

  gig_description: `You write gig and service descriptions for freelance marketplaces.

Guidelines:
- Open with the specific outcome the buyer gets, not the seller's background.
- Cover: what's included, typical turnaround, who it's for, what's not included.
- Use scannable short paragraphs or bullets; buyers skim.
- Include a clear call-to-action at the end (e.g., "Message me with your project details").
- Avoid buzzwords ("synergy", "cutting-edge", "world-class") and unsubstantiated claims.
- Match the platform's length norms when the input specifies a platform.`,

  profile_summary: `You write profile summaries (the "About" section) for freelance and professional networking platforms.

Guidelines:
- Lead with the specific niche and the problem the person solves.
- Cover: what they do, who they do it for, proof (experience/results from the input), and how to engage.
- Use first person. Conversational but professional.
- Length: 100-200 words, tightened to the platform's sweet spot.
- No emoji or decorative markdown unless the input requests them.
- Never invent credentials, clients, or metrics.`,
};

const PLATFORM_GUIDANCE: Record<TargetPlatform, string> = {
  linkedin:
    'LinkedIn audience. Professional but human. Favor narrative over lists in bios and summaries. No hashtags unless relevant.',
  upwork:
    'Upwork audience. Buyers are scanning for a specific skill + proof + reliability. Be concrete, name the stack, highlight turnaround and communication.',
  fiverr:
    'Fiverr audience. Buyers look for clear packaging, fast delivery, and predictable outcomes. Keep copy tight and outcome-focused.',
  reddit:
    'Reddit audience. Avoid marketing tone. Be direct, specific, and helpful. Do not use phrases like "I am excited to" or "I am passionate about".',
};

@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);
  private readonly anthropic: Anthropic | null;
  private readonly model: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    const modelEnv = this.configService.get<string>('ANTHROPIC_MODEL');
    this.model = modelEnv && modelEnv.trim().length > 0 ? modelEnv.trim() : DEFAULT_MODEL;

    if (!apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY is not set — AI generation requests will return 503 until it is configured.',
      );
      this.anthropic = null;
    } else {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  async generate(userId: string, input: GenerateInput) {
    const sb = this.supabaseService.getAdminClient();
    const now = new Date().toISOString();

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

    const generatedText = await this.callAnthropic(input);

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

    if (usage) {
      await sb
        .from('usage')
        .update({ ai_generations_used: (usage.ai_generations_used ?? 0) + 1 })
        .eq('id', usage.id);
    }

    return generation;
  }

  private async callAnthropic(input: GenerateInput): Promise<string> {
    if (!this.anthropic) {
      throw new ServiceUnavailableException(
        'AI generation is not configured. Set ANTHROPIC_API_KEY to enable it.',
      );
    }

    const systemPrompt = TOOL_SYSTEM_PROMPTS[input.tool_type];
    const platformLine = input.target_platform
      ? `\n\nTarget platform: ${input.target_platform}. ${PLATFORM_GUIDANCE[input.target_platform]}`
      : '';
    const userPrompt = `Generate a ${input.tool_type.replace(/_/g, ' ')} using the following input. Use only the facts provided — do not invent experience, employers, dates, or metrics.\n\nInput:\n${JSON.stringify(input.input_data, null, 2)}${platformLine}`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();

      if (!text) {
        this.logger.error(
          `Anthropic returned no text. stop_reason=${response.stop_reason}`,
        );
        throw new InternalServerErrorException(
          'AI generation returned an empty response.',
        );
      }

      return text;
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) {
        this.logger.warn('Anthropic rate limit hit');
        throw new ServiceUnavailableException(
          'AI service is busy. Please try again in a moment.',
        );
      }
      if (err instanceof Anthropic.APIError) {
        this.logger.error(`Anthropic API error ${err.status}: ${err.message}`);
        throw new InternalServerErrorException('AI generation failed.');
      }
      throw err;
    }
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
