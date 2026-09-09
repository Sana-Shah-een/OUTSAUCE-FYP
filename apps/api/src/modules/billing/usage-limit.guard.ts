import { CanActivate, ExecutionContext, Injectable, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsageService } from './usage.service';

export const USAGE_EVENT_KEY = 'usageEvent';
export const RequireUsage = (eventType: 'lead_created' | 'hunt_created' | 'ai_generation') =>
  SetMetadata(USAGE_EVENT_KEY, eventType);

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private readonly usageService: UsageService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const eventType = this.reflector.get<string>(USAGE_EVENT_KEY, context.getHandler());
    if (!eventType) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) return true;

    const withinLimit = await this.usageService.checkLimit(userId, eventType as any);
    if (!withinLimit) {
      throw new ForbiddenException({
        code: 'USAGE_LIMIT_REACHED',
        message: `You've reached your plan's limit for this action. Upgrade to continue.`,
      });
    }

    return true;
  }
}
