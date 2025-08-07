import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // Permite cualquier origen (desarrollo)
    credentials: true,
  });

  // ¡AQUÍ EL CAMBIO!
  await app.listen(3000, '0.0.0.0'); // Así tu ESP32 y cualquier PC/móvil pueden conectarse por IP
}
bootstrap();
