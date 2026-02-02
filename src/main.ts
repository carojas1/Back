import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

// 🔥 Importante para cargar variables del .env
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Seguridad HTTP
  app.use(helmet());
  app.use(cookieParser());

  // CORS Permisivo para Apps Híbridas y Web
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Prefijo global /api
  app.setGlobalPrefix('api');

  // Prefix Global (/api)


  // Puerto dinámico para despliegue (Render, Railway, Vercel)
  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
  console.log('🚀 Backend iniciado v2 - CORS Mobile OK');
}

bootstrap();
