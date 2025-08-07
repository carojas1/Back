import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Importa TODOS los módulos propios aquí:
import { AuthModule } from './auth/auth.module';
import { ClientesModule } from './clientes/clientes.module';
import { UsersModule } from './users/users.module'; // <-- Importa tu módulo de usuarios aquí
import { ReportsModule } from './reports.module';
import { AlertModule } from './alert.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123456',
      database: 'auth_db',
      autoLoadEntities: true,   // detecta entidades automáticamente
      synchronize: true,        // ¡NO usar en producción!
    }),
    AuthModule,
    ClientesModule,
    UsersModule,   // <-- ¡Debe estar aquí!
    ReportsModule,
    AlertModule,
  ],
})
export class AppModule {}