// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private users: { id: number; nombre: string; email: string; password: string }[] = [];

  constructor(private jwtService: JwtService) {}

  async register(nombre: string, email: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now(),
      nombre,
      email,
      password: hashed,
    };
    this.users.push(user);
    return { message: 'Usuario creado' };
  }

  async login(email: string, password: string) {
    const user = this.users.find((u) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }
}
