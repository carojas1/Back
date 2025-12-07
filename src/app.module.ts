import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 🔥 Cargar variables de entorno ANTES de usar process.env
import * as dotenv from 'dotenv';
dotenv.config();

// Módulos
import { AuthModule } from './auth/auth.module';
import { ClientesModule } from './clientes/clientes.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports.module';
import { AlertModule } from './alert.module';

// Entidades
import { User } from './users/user.entity';
import { Alert } from './alert.entity';
import { Lente } from './lentes/lente.entity';
import { Contacto } from './Contacto/contacto.entity';
import { ExportHistory } from './export-history.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // 👉 AHORA SÍ LEE NEON

      entities: [User, Alert, Lente, Contacto, ExportHistory],

      // SSL para Neon
      ssl: {
        rejectUnauthorized: false,
      },

      synchronize: false,
    }),

    AuthModule,
    ClientesModule,
    UsersModule,
    ReportsModule,
    AlertModule,
  ],
})
export class AppModule { }
