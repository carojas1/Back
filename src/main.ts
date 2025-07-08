import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
   origin: [
      'http://localhost:4200',        // Para desarrollo local en la PC
      'http://10.10.8.227:4200',      // Para acceso desde el celular
    ],
  });

  await app.listen(3000);
}
bootstrap();
