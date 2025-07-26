import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { ClientesModule } from './clientes/clientes.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',          // Cambia si usas otro usuario
      password: '123456',     // Pega tu contraseña local real
      database: 'auth_db',
      autoLoadEntities: true,
      synchronize: true,             // true para desarrollo, false si ya tienes tablas hechas
    }),
    AuthModule,
    ClientesModule,
    UsersModule,
  ],
})
export class AppModule {}
