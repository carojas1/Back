import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),  // <-- ¡AGREGA ESTO!
    JwtModule.register({
      secret: 'tu_jwt_secret', // Usa env variable en producción
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],  // <-- ¡AGREGA JwtStrategy!
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, PassportModule], // <-- ¡EXPORTA!
})
export class AuthModule {}
