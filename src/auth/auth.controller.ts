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
    // 1. Validar token
    const token = authHeader?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Token no proporcionado');

    const decoded = await this.firebaseService.verifyToken(token);
    if (!decoded || decoded.uid !== body.firebaseUid) {
      throw new UnauthorizedException('Token inválido o no coincide con UID');
    }

    console.log('🔥 Firebase sync verificado:', body.email);

    // 2. Lógica de negocio
    let user = await this.authService.findByEmail(body.email);

    if (!user) {
      user = await this.authService.createFromFirebase({
        email: body.email,
        nombre: body.nombre || body.email.split('@')[0],
        firebaseUid: body.firebaseUid,
      });
      console.log('✅ Usuario creado:', user.email);
    } else {
      if (!user.firebaseUid) {
        user = await this.authService.updateFirebaseUid(user.id, body.firebaseUid);
      }
      console.log('✅ Usuario sincronizado:', user.email);
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  }

  @Post('firebase-register')
  async firebaseRegister(
    @Body() body: { firebaseUid: string; email: string; nombre: string; telefono: string },
    @Headers('authorization') authHeader: string,
  ) {
    // 1. Validar token
    const token = authHeader?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Token no proporcionado');

    const decoded = await this.firebaseService.verifyToken(token);
    if (!decoded) throw new UnauthorizedException('Token inválido');

    console.log('🔥 Firebase register verificado:', body.email);

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

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        telefono: user.telefono,
        rol: user.rol,
      },
    };
  }
}
