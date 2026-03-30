import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@supabase/supabase-js';

@Controller('auth')
@UseGuards(SupabaseAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user);
  }

  @Post('profile')
  completeOnboarding(
    @CurrentUser() user: User,
    @Body() body: Record<string, unknown>,
  ) {
    return this.authService.completeOnboarding(user, body);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: User,
    @Body() body: Record<string, unknown>,
  ) {
    return this.authService.updateProfile(user, body);
  }
}
