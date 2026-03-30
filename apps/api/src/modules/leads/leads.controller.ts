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
import {
  createLeadSchema,
  bulkCreateLeadSchema,
  updateLeadSchema,
  createFolderSchema,
  createTagSchema,
} from './dto/lead.dto';
import type {
  CreateLeadInput,
  BulkCreateLeadInput,
  UpdateLeadInput,
  CreateFolderInput,
  CreateTagInput,
} from './dto/lead.dto';
import { LeadsService } from './leads.service';

const addTagsSchema = z.object({
  tag_ids: z.array(z.string().uuid()).min(1),
});

type AddTagsInput = z.infer<typeof addTagsSchema>;

@Controller('leads')
@UseGuards(SupabaseAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createLeadSchema)) input: CreateLeadInput,
  ) {
    return this.leadsService.create(user.id, input);
  }

  @Post('bulk')
  bulkCreate(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(bulkCreateLeadSchema))
    input: BulkCreateLeadInput,
  ) {
    return this.leadsService.bulkCreate(user.id, input);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('folder_id') folder_id?: string,
    @Query('tag_id') tag_id?: string,
  ) {
    return this.leadsService.findAll(user.id, {
      status,
      folder_id,
      tag_id,
      page: Math.max(1, parseInt(page ?? '1', 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20)),
    });
  }

  @Get('folders')
  getFolders(@CurrentUser() user: User) {
    return this.leadsService.getFolders(user.id);
  }

  @Get('tags')
  getTags(@CurrentUser() user: User) {
    return this.leadsService.getTags(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leadsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLeadSchema)) input: UpdateLeadInput,
  ) {
    return this.leadsService.update(user.id, id, input);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leadsService.remove(user.id, id);
  }

  @Post('folders')
  createFolder(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createFolderSchema)) input: CreateFolderInput,
  ) {
    return this.leadsService.createFolder(user.id, input);
  }

  @Patch('folders/:id')
  updateFolder(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createFolderSchema)) input: CreateFolderInput,
  ) {
    return this.leadsService.updateFolder(user.id, id, input);
  }

  @Delete('folders/:id')
  removeFolder(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leadsService.removeFolder(user.id, id);
  }

  @Post('tags')
  createTag(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createTagSchema)) input: CreateTagInput,
  ) {
    return this.leadsService.createTag(user.id, input);
  }

  @Patch('tags/:id')
  updateTag(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createTagSchema)) input: CreateTagInput,
  ) {
    return this.leadsService.updateTag(user.id, id, input);
  }

  @Delete('tags/:id')
  removeTag(@CurrentUser() user: User, @Param('id') id: string) {
    return this.leadsService.removeTag(user.id, id);
  }

  @Post(':id/tags')
  addTags(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addTagsSchema)) input: AddTagsInput,
  ) {
    return this.leadsService.addTagsToLead(user.id, id, input.tag_ids);
  }

  @Delete(':id/tags/:tagId')
  removeTagFromLead(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    return this.leadsService.removeTagFromLead(user.id, id, tagId);
  }
}
