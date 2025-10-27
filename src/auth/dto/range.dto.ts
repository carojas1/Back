// src/reports/dto/range.dto.ts
import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class RangeDto {
  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
