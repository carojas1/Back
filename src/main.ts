import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  app.use(helmet());
  app.use(cookieParser());

  
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://alerta-vision-frontend.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
}
bootstrap();
