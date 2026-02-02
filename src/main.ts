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

  // CORS
  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origen (Apps móbiles, Curl, Postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:4200',
        'https://alerta-vision-frontend.vercel.app',
        'http://localhost',             // Capacitor Android (HTTP)
        'https://localhost',            // Capacitor Android (HTTPS) - ESTE ERA EL BLOQUEO
        'capacitor://localhost',        // Capacitor iOS
        'http://192.168.0.105',
        'http://192.168.100.9',
        'https://alerta-vision-backend.onrender.com'
      ];

      // Permitir cualquier subdominio o localhost dinámico en desarrollo si quieres:
      if (allowedOrigins.includes(origin) || origin.startsWith('http://192.168.')) {
        callback(null, true);
      } else {
        console.warn('⚠️ Origen bloqueado por CORS:', origin);
        // callback(new Error('Not allowed by CORS')); // Descomentar para estricto
        callback(null, true); // 🔥 PERMITIR TODO TEMPORALMENTE PARA ARREGLARLO YA
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Prefijo global /api
  app.setGlobalPrefix('api');

  // Prefix Global (/api)
  app.setGlobalPrefix('api');

  // Puerto dinámico para despliegue (Render, Railway, Vercel)
  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
  console.log('🚀 Backend iniciado v2 - CORS Mobile OK');
}

bootstrap();
