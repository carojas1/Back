import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register/create-user.dto';
import * as bcrypt from 'bcrypt';
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
    const exists = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono,
      password: hashedPassword,
      rol: dto.rol || 'user',
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
    const user = this.userRepository.create({
      email: data.email,
      nombre: data.nombre,
      firebaseUid: data.firebaseUid,
      telefono: data.telefono || '',
      rol: 'user',
      password: '', // Sin password local
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
