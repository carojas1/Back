import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entidades
import { User } from './users/user.entity';
import { Alert } from './alert.entity';
import { Lente } from './lentes/lente.entity';
import { Contacto } from './Contacto/contacto.entity';
import { ExportHistory } from './export-history.entity';

// Módulos
import { AuthModule } from './auth/auth.module';
import { ClientesModule } from './clientes/clientes.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports.module';
import { AlertModule } from './alert.module';

@Module({
  imports: [
    // Carga .env global
    ConfigModule.forRoot({ isGlobal: true }),

    // 🔥 Conexión a Neon
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,   // viene del .env o variables de Render

      // 👇 Registramos explícitamente TODAS las entidades
      entities: [User, Alert, Lente, Contacto, ExportHistory],

      synchronize: false,
      ssl: {
        rejectUnauthorized: false,
      },
    }),

    AuthModule,
    ClientesModule,
    UsersModule,
    ReportsModule,
    AlertModule,
  ],
})
export class AppModule { }
