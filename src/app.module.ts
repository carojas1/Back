import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientesModule } from './clientes/clientes.module';
import { AuthModule } from './auth/auth.module'; // AGREGA ESTA LÍNEA

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123456',
      database: 'auth_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    ClientesModule,
    AuthModule, // AGREGA AQUÍ TAMBIÉN
  ],
})
export class AppModule {}