import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller'; // IMPORTA
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: 'jwt-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController], // AGREGA AQUÍ
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}