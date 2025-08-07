// src/auth/dto/register/create-user.dto.ts
export class RegisterDto {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  rol?: string; // Si quieres usar enum, cámbialo, pero debe llamarse igual en todos lados
}
