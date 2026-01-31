import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateAlertDto {
  // Frontend format
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  message?: string;

  // ESP32 format
  @IsString()
  @IsOptional()
  tipo_alerta?: string;

  @IsString()
  @IsOptional()
  mensaje?: string;

  @IsInt()
  @IsOptional()
  usuarioId?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  telefonoUsuario?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  nivelFatiga?: number;
}
