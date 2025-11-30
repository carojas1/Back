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
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepository.findOne({ where: { email: dto.email } });
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

    await this.userRepository.save(user);

   
    const { password, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Usuario o contraseña incorrectos');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new BadRequestException('Usuario o contraseña incorrectos');

    // Genera JWT con el nombre incluido muy necesario
    const payload = { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol };
    const access_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Devuelve token y datos básicos acuerdate
    return {
      access_token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    };
  }
}
