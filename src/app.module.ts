import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
import { ExportHistory } from './export-history.entity'; // <--- 1. IMPÓRTALO AQUÍ

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123456',
      database: 'alertas_app_v2',
      
      // 2. AGRÉGALO A ESTA LISTA OBLIGATORIAMENTE
      entities: [User, Alert, Lente, Contacto, ExportHistory], 
      
      synchronize: false, 
    }),
    AuthModule,
    ClientesModule,
    UsersModule,
    ReportsModule,
    AlertModule,
  ],
})
export class AppModule {}