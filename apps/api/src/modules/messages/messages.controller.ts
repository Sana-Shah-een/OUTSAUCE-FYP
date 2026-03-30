import {
  Body,
  Controller,
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
import { MessagesService } from './messages.service';

const createConversationSchema = z.object({
  recipient_id: z.string().uuid(),
});

type CreateConversationInput = z.infer<typeof createConversationSchema>;

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

type SendMessageInput = z.infer<typeof sendMessageSchema>;

@Controller('messages')
@UseGuards(SupabaseAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('conversations')
  createConversation(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createConversationSchema))
    input: CreateConversationInput,
  ) {
    return this.messagesService.createConversation(
      user.id,
      input.recipient_id,
    );
  }

  @Get('conversations')
  getConversations(@CurrentUser() user: User) {
    return this.messagesService.getConversations(user.id);
  }

  @Post('conversations/:id')
  sendMessage(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) input: SendMessageInput,
  ) {
    return this.messagesService.sendMessage(user.id, id, input.content);
  }

  @Get('conversations/:id')
  getMessages(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getMessages(
      user.id,
      id,
      Math.max(1, parseInt(page ?? '1', 10) || 1),
      Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20)),
    );
  }

  @Patch('conversations/:id/read')
  markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.messagesService.markAsRead(user.id, id);
  }
}
