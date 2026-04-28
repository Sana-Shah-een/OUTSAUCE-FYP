import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api');

  const corsOriginEnv = process.env.CORS_ORIGIN;
  const corsOrigin = corsOriginEnv
    ? corsOriginEnv.split(',').map((s) => s.trim()).filter(Boolean)
    : true;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.API_PORT || 3001;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
