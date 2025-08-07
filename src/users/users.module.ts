import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { AuthModule } from '../auth/auth.module';  // <-- AGREGA ESTA LÍNEA

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule, // <-- AGREGA AQUÍ
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
