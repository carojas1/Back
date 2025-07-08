import { Role } from "src/auth/roles.enum";

export class RegisterDto {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol?: Role;
}