import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createScrapeSchema } from './dto/create-scrape.dto';
import type { CreateScrapeInput } from './dto/create-scrape.dto';
import { ScrapesService } from './scrapes.service';
import { UsageLimitGuard, RequireUsage } from '../billing/usage-limit.guard';
import { UsageService } from '../billing/usage.service';

@Controller('scrapes')
@UseGuards(SupabaseAuthGuard)
export class ScrapesController {
  constructor(
    private readonly scrapesService: ScrapesService,
    private readonly usageService: UsageService,
  ) {}

  @Post()
  @UseGuards(UsageLimitGuard)
  @RequireUsage('hunt_created')
  async create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createScrapeSchema)) input: CreateScrapeInput,
  ) {
    const job = await this.scrapesService.create(user.id, input);
    await this.usageService.recordUsage(user.id, 'hunt_created', { hunt_id: job.id });
    return job;
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.scrapesService.findAllByUser(
      user.id,
      Math.max(1, parseInt(page ?? '1', 10) || 1),
      Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20)),
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.scrapesService.findOne(user.id, id);
  }

  @Get(':id/results')
  getResults(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.scrapesService.getResults(
      user.id,
      id,
      Math.max(1, parseInt(page ?? '1', 10) || 1),
      Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20)),
    );
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.scrapesService.cancel(user.id, id);
  }

  @Post(':id/rerun')
  rerun(@CurrentUser() user: User, @Param('id') id: string) {
    return this.scrapesService.rerun(user.id, id);
  }
}
