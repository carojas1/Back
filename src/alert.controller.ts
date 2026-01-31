// src/alert.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './auth/dto/create-alert.dto';
import { JwtAuthGuard } from './auth/jwt-auth/jwt-auth.guard';

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) { }

  // ✅ Endpoint PROTEGIDO para crear alertas (usuarios autenticados)
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() createAlertDto: CreateAlertDto) {
    return this.alertService.create(req.user, createAlertDto);
  }

  // ✅ Endpoint PÚBLICO para el ESP32 (sin JWT)
  // El ESP32 envía usuarioId en el body
  @Post('esp32')
  async createFromESP32(@Body() createAlertDto: CreateAlertDto) {
    // El ESP32 envía { usuarioId, nivelFatiga, tipo_alerta, mensaje }
    const userId = createAlertDto.usuarioId ?? 1; // Default a usuario 1 si no viene
    const user = { id: userId };
    return this.alertService.create(user, createAlertDto);
  }

  // Historial del usuario logueado
  @Get()
  @UseGuards(JwtAuthGuard)
  async findMine(@Request() req) {
    return this.alertService.findByUser(req.user.id);
  }
}
