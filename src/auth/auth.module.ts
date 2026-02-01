import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

// ✅ IMPORTAR DESDE ARCHIVO CENTRALIZADO - NUNCA DUPLICAR
import { JWT_CONFIG, getJwtDebugInfo } from '../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_CONFIG.secret,  // ✅ Usa config centralizada
      signOptions: { expiresIn: JWT_CONFIG.expiresIn },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {
  constructor() {
    // Log para verificar que el secret es consistente
    console.log('🔐 AuthModule JWT Config:', getJwtDebugInfo());
  }
}

