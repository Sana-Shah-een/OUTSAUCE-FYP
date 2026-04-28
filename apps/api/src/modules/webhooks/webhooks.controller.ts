import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { scrapeCallbackSchema } from './dto/scrape-callback.dto';
import type { ScrapeCallbackInput } from './dto/scrape-callback.dto';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly configService: ConfigService,
  ) {}

  @Post('n8n/results')
  processN8nResults(
    @Headers('x-webhook-secret') secret: string,
    @Body(new ZodValidationPipe(scrapeCallbackSchema))
    payload: ScrapeCallbackInput,
  ) {
    const expectedSecret = this.configService.get<string>('N8N_WEBHOOK_SECRET');

    if (expectedSecret && expectedSecret.length > 0) {
      if (!secret || secret !== expectedSecret) {
        throw new UnauthorizedException('Invalid webhook secret');
      }
    }

    return this.webhooksService.processN8nCallback(payload);
  }
}
