// src/auth/dto/register/register.dto.ts
import { Role } from '../../roles.enum';

export class RegisterDto {
  nombre: string;
  email: string;
  password: string;
  rol: Role;
}
