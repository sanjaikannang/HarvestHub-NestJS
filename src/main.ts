import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import { ConfigService } from './config/config.service';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService)

  const baseUrl = configService.getBaseUrl();

  app.use(cors({
    origin: [
      baseUrl
    ],
    credentials: true,
  }));

  await app.listen(process.env.PORT ?? 8000);
  
}
bootstrap();
