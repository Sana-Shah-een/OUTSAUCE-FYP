import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { saveProfileSchema, type SaveProfileInput } from './dto/profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(SupabaseAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: User) {
    return this.profileService.getByUserId(user.id);
  }

  @Post()
  saveProfile(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(saveProfileSchema)) input: SaveProfileInput,
  ) {
    return this.profileService.saveProfile(user.id, input);
  }
}
