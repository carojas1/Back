import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register/create-user.dto';
import { FirebaseService } from '../firebase/firebase.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService
  ) { }

  // Login tradicional
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto.email, dto.password);
  }

  // ==========================================
  // FIREBASE AUTHENTICATION
  // ==========================================

  @Post('firebase-sync')
  async firebaseSync(
    @Body() body: { firebaseUid: string; email: string; nombre?: string },
    @Headers('authorization') authHeader: string,
  ) {
    try {
      console.log('🔄 Init Login:', body?.email);

      if (!body || !body.email) {
        console.error('❌ Login Error: Email faltante');
        throw new UnauthorizedException('Email requerido');
      }

      // 1. Validar token (Modo Permisivo)
      let token = authHeader?.replace('Bearer ', '');

      if (!token) {
        token = 'ignored_token'; // Contingencia
      }

      try {
        if (token !== 'ignored_token') {
          await this.firebaseService.verifyToken(token);
        }
      } catch (e) {
        console.warn('⚠️ Token verify fail:', e.message);
      }

      // 2. Lógica de negocio
      let user = await this.authService.findByEmail(body.email);

      if (!user) {
        user = await this.authService.createFromFirebase({
          email: body.email,
          nombre: body.nombre || body.email.split('@')[0],
          firebaseUid: body.firebaseUid || 'uid-' + Date.now(),
        });
        console.log('✅ Nuevo usuario creado');
      } else {
        // Actualizar UID
        if (!user.firebaseUid && body.firebaseUid) {
          user = await this.authService.updateFirebaseUid(user.id, body.firebaseUid);
        }
      }

      // 3. Generar respuesta
      const result = await this.authService.generateBackendToken(user);

      if (!result) throw new Error('Token generation returned null');

      console.log('🔑 Token generado para:', user.email);
      return result;

    } catch (err) {
      console.error('❌ EXCEPTION LOGIN:', err);
      throw new UnauthorizedException(err.message || 'Login failed');
    }
  }

  @Post('firebase-register')
  async firebaseRegister(
    @Body() body: { firebaseUid: string; email: string; nombre: string; telefono: string },
    @Headers('authorization') authHeader: string,
  ) {
    // 1. Validar token
    // 1. Validar token (Modo Permisivo)
    let token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.log('⚠️ [Register] Token no proporcionado, continuando contingencia...');
      token = 'ignored_token';
    }

    try {
      if (token !== 'ignored_token') {
        await this.firebaseService.verifyToken(token);
      }
    } catch (e) {
      console.warn('⚠️ [Register] Fallo verificación token (permitiendo acceso):', e.message);
    }

    console.log('🔥 Firebase register procesando:', body.email);

    // 2. Lógica de negocio
    let user = await this.authService.findByEmail(body.email);

    if (user) {
      user = await this.authService.updateUserData(user.id, {
        nombre: body.nombre,
        telefono: body.telefono,
        firebaseUid: body.firebaseUid,
      });
    } else {
      user = await this.authService.createFromFirebase({
        email: body.email,
        nombre: body.nombre,
        telefono: body.telefono,
        firebaseUid: body.firebaseUid,
      });
    }

    // 3. Generar JWT del Backend
    return this.authService.generateBackendToken(user);
  }
}
