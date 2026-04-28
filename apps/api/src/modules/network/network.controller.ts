import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { z } from 'zod';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NetworkService } from './network.service';

const connectSchema = z.object({
  recipient_id: z.string().uuid(),
  message: z.string().max(500).optional(),
});

type ConnectInput = z.infer<typeof connectSchema>;

const updateConnectionSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>;

@Controller('network')
@UseGuards(SupabaseAuthGuard)
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('discover')
  discover(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('user_type') user_type?: string,
  ) {
    return this.networkService.discover(user.id, {
      page: Math.max(1, parseInt(page ?? '1', 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20)),
      user_type,
    });
  }

  @Post('connect')
  connect(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(connectSchema)) input: ConnectInput,
  ) {
    return this.networkService.sendConnectionRequest(
      user.id,
      input.recipient_id,
      input.message,
    );
  }

  @Patch('connections/:id')
  updateConnection(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateConnectionSchema))
    input: UpdateConnectionInput,
  ) {
    return this.networkService.updateConnection(user.id, id, input.status);
  }

  @Delete('connections/:id')
  cancelRequest(@CurrentUser() user: User, @Param('id') id: string) {
    return this.networkService.cancelRequest(user.id, id);
  }

  @Get('connections')
  getConnections(
    @CurrentUser() user: User,
    @Query('status') status?: string,
  ) {
    return this.networkService.getConnections(user.id, status);
  }
}
