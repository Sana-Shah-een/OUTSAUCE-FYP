import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { generateSchema } from './dto/ai-tools.dto';
import type { GenerateInput } from './dto/ai-tools.dto';
import { generateOutreachSchema } from './dto/outreach.dto';
import type { GenerateOutreachInput } from './dto/outreach.dto';
import { AiToolsService } from './ai-tools.service';
import { UsageLimitGuard, RequireUsage } from '../billing/usage-limit.guard';
import { UsageService } from '../billing/usage.service';

@Controller('ai-tools')
@UseGuards(SupabaseAuthGuard)
export class AiToolsController {
  constructor(
    private readonly aiToolsService: AiToolsService,
    private readonly usageService: UsageService,
  ) {}

  @Post('generate')
  @UseGuards(UsageLimitGuard)
  @RequireUsage('ai_generation')
  async generate(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(generateSchema)) input: GenerateInput,
  ) {
    const result = await this.aiToolsService.generate(user.id, input);
    await this.usageService.recordUsage(user.id, 'ai_generation', { tool_type: input.tool_type });
    return result;
  }

  @Post('generate-outreach')
  @UseGuards(UsageLimitGuard)
  @RequireUsage('ai_generation')
  async generateOutreach(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(generateOutreachSchema)) input: GenerateOutreachInput,
  ) {
    const result = await this.aiToolsService.generateOutreach(user.id, input);
    await this.usageService.recordUsage(user.id, 'ai_generation', { type: 'outreach', lead_id: input.leadId });
    return result;
  }

  @Get('history')
  getHistory(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tool_type') tool_type?: string,
  ) {
    return this.aiToolsService.getHistory(
      user.id,
      Math.max(1, parseInt(page ?? '1', 10) || 1),
      Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20)),
      tool_type,
    );
  }
}
