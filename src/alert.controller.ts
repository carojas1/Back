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
  // El ESP32 puede enviar email o usuarioId
  @Post('esp32')
  async createFromESP32(@Body() createAlertDto: CreateAlertDto) {
    console.log('📥 Alerta recibida del ESP32:', createAlertDto);
    return this.alertService.createFromESP32(createAlertDto);
  }

  // Historial del usuario logueado
  @Get()
  @UseGuards(JwtAuthGuard)
  async findMine(@Request() req) {
    return this.alertService.findByUser(req.user.id);
  }
}
