import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register/create-user.dto';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  // ==========================================
  // MÉTODOS EXISTENTES (LEGACY)
  // ==========================================
  async register(dto: RegisterDto) {
    // 1. Verificar si existe en DB local
    const exists = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('El usuario ya existe en nuestra base de datos');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    let firebaseUid = '';

    // 2. Intentar crear en Firebase (si falla porque ya existe, recuperamos el UID)
    try {
      const fbUser = await admin.auth().createUser({
        email: dto.email,
        password: dto.password,
        displayName: dto.nombre,
        phoneNumber: dto.telefono && dto.telefono.length > 5 ? dto.telefono : undefined
      });
      firebaseUid = fbUser.uid;
      console.log('✅ Usuario creado en Firebase:', firebaseUid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️ El usuario ya existe en Firebase, recuperando UID...');
        const fbUser = await admin.auth().getUserByEmail(dto.email);
        firebaseUid = fbUser.uid;
      } else {
        console.error('❌ Error creando en Firebase:', error);
        // Opcional: throw new BadRequestException('Error registrando en Firebase: ' + error.message);
      }
    }

    // 3. Crear en Neon con el UID de Firebase
    const user = this.userRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono,
      password: hashedPassword,
      rol: dto.rol || 'user',
      firebaseUid: firebaseUid, // <-- Guardamos la relación
    });

    await this.userRepository.save(user); // Guardar
    const { password, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Credenciales incorrectas');

    // Si el usuario fue creado con Google y no tiene password
    if (!user.password && user.firebaseUid) {
      throw new BadRequestException('Inicia sesión con Google');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new BadRequestException('Credenciales incorrectas');

    const payload = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      telefono: user.telefono, // Incluir telefono
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
      },
    };
  }

  // ==========================================
  // NUEVOS MÉTODOS PARA FIREBASE
  // ==========================================

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async createFromFirebase(data: {
    email: string;
    nombre: string;
    firebaseUid: string;
    telefono?: string;
  }): Promise<User> {
    // 🛡️ REGLA MAESTRA: Si es el correo del jefe, es ADMIN
    const esAdmin = data.email === 'carojas@sudamericano.edu.ec';

    const user = this.userRepository.create({
      email: data.email,
      nombre: data.nombre,
      firebaseUid: data.firebaseUid,
      telefono: data.telefono || '',
      rol: esAdmin ? 'admin' : 'user', // Asignación automática
      password: '',
    });
    return this.userRepository.save(user);
  }

  async updateFirebaseUid(userId: number, firebaseUid: string): Promise<User> {
    await this.userRepository.update(userId, { firebaseUid });
    return this.userRepository.findOne({ where: { id: userId } }) as Promise<User>;
  }

  async updateUserData(userId: number, data: Partial<User>): Promise<User> {
    await this.userRepository.update(userId, data);
    return this.userRepository.findOne({ where: { id: userId } }) as Promise<User>;
  }
}
