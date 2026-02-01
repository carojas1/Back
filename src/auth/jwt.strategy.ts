// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// ✅ IMPORTAR DESDE ARCHIVO CENTRALIZADO - NUNCA DUPLICAR
import { JWT_CONFIG, getJwtDebugInfo } from '../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_CONFIG.secret,  // ✅ Usa config centralizada
    });

    // Log para verificar que el secret es consistente
    console.log('🔐 JwtStrategy JWT Config:', getJwtDebugInfo());
  }

  async validate(payload: any) {
    console.log('🔐 JWT Validate Payload:', payload);
    return {
      id: payload.id,
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
    };
  }
}

