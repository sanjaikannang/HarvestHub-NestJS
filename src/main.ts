import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontEndBaseUrl = process.env.FRONT_END_BASE_URL;
  const localFrontEndBaseUrl = process.env.LOCAL_FRONT_END_BASE_URL;

  app.use(cors({
    origin: [
      frontEndBaseUrl, localFrontEndBaseUrl
    ],
    credentials: true,
  }));

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
