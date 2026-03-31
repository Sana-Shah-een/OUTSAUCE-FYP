import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import type { Response } from 'express';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { exportLeadsSchema } from './dto/export.dto';
import type { ExportLeadsInput } from './dto/export.dto';
import { ExportService } from './export.service';

@Controller('export')
@UseGuards(SupabaseAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('leads')
  async exportLeads(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(exportLeadsSchema)) input: ExportLeadsInput,
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportLeads(
      user.id,
      input.lead_ids,
      input.format,
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.content);
  }
}
